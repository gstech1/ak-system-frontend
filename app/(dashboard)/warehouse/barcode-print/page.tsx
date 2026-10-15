"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Barcode, Check, Clock3, Printer, Settings2, SlidersHorizontal } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import {
  configureBarcodeSequence,
  decideBarcodeAuthorization,
  generateBarcodeLabels,
  getBarcodePrintOverview,
  requestBarcodeAuthorization,
  type BarcodeAuthorizationRequest,
  type BarcodePrintJob,
  type BarcodePrintOverview,
} from "@/lib/api";

const APPROVER_ROLES = new Set(["ADMIN", "BOSS", "MANAGER"]);
type PrinterSettings = {
  labelWidth: number;
  labelHeight: number;
  horizontalGap: number;
  verticalGap: number;
};

const ROLL_WIDTH_MM = 101.6;
const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  labelWidth: 32,
  labelHeight: 25,
  horizontalGap: 0,
  verticalGap: 0,
};

function getColumns(settings: PrinterSettings) {
  return Math.max(1, Math.floor((ROLL_WIDTH_MM + settings.horizontalGap + 0.0001) / (settings.labelWidth + settings.horizontalGap)));
}

function encodePrinterSettings(settings: PrinterSettings) {
  return `ROLL:${ROLL_WIDTH_MM}:${settings.labelWidth}:${settings.labelHeight}:${getColumns(settings)}:${settings.horizontalGap}:${settings.verticalGap}`;
}

function parsePrinterSettings(layout: string): PrinterSettings {
  const match = layout.match(/^ROLL:(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):(\d+):(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!match) return DEFAULT_PRINTER_SETTINGS;
  const [, paperWidth, labelWidth, labelHeight, columns, horizontalGap, verticalGap] = match;
  void paperWidth;
  void columns;
  return {
    labelWidth: Number(labelWidth), labelHeight: Number(labelHeight),
    horizontalGap: Number(horizontalGap), verticalGap: Number(verticalGap),
  };
}

function describeLayout(layout: string) {
  const settings = parsePrinterSettings(layout);
  return `4-inch roll · ${getColumns(settings)} across · ${settings.labelWidth} × ${settings.labelHeight} mm`;
}

function presetFor(width: number, height: number) {
  if (width === 32 && height === 25) return "32x25";
  if (width === 50.8 && height === 25.4) return "2x1in";
  if (width === 25.4 && height === 25.4) return "1x1in";
  return "custom";
}

const CODE39: Record<string, number> = {
  "0": 0x034, "1": 0x121, "2": 0x061, "3": 0x160, "4": 0x031,
  "5": 0x130, "6": 0x070, "7": 0x025, "8": 0x124, "9": 0x064,
  A: 0x109, B: 0x049, C: 0x148, D: 0x019, E: 0x118, F: 0x058,
  G: 0x00d, H: 0x10c, I: 0x04c, J: 0x01c, K: 0x103, L: 0x043,
  M: 0x142, N: 0x013, O: 0x112, P: 0x052, Q: 0x007, R: 0x106,
  S: 0x046, T: 0x016, U: 0x181, V: 0x0c1, W: 0x1c0, X: 0x091,
  Y: 0x190, Z: 0x0d0, "-": 0x0c4, ".": 0x1a8, " ": 0x0a8,
  "*": 0x094,
};

function code39Svg(code: string) {
  const characters = `*${code.toUpperCase()}*`;
  let x = 0;
  const bars: string[] = [];
  for (const character of characters) {
    const pattern = CODE39[character];
    if (pattern === undefined) continue;
    for (let index = 0; index < 9; index += 1) {
      const width = (pattern & (1 << index)) === 0 ? 1 : 2.2;
      if (index % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${width}" height="48"/>`);
      x += width;
    }
    x += 1;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} 48" role="img" aria-label="Barcode ${code}" preserveAspectRatio="none">${bars.join("")}</svg>`;
}

function printLabels(job: BarcodePrintJob) {
  const settings = parsePrinterSettings(job.layout);
  const columns = getColumns(settings);
  const rowPitch = settings.labelHeight + settings.verticalGap;
  const popup = window.open("", "_blank", "width=800,height=700");
  if (!popup) return false;
  const rows: string[] = [];
  for (let index = 0; index < job.codes.length; index += columns) {
    const rowCodes = job.codes.slice(index, index + columns);
    while (rowCodes.length < columns) rowCodes.push("");
    rows.push(`<section class="label-row">${rowCodes.map((code) => code ? `
      <div class="label">
        <div class="brand">MTK SOLAR</div>
        ${code39Svg(code)}
        <div class="code">${code}</div>
      </div>` : '<div class="label empty"></div>').join("")}</section>`);
  }
  const labels = rows.join("");
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>MTK barcode labels</title>
    <style>
      @page { size: ${ROLL_WIDTH_MM}mm ${rowPitch}mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: white; color: #000; font-family: Arial, sans-serif; }
      .label-row { width: ${ROLL_WIDTH_MM}mm; height: ${rowPitch}mm; display: grid; grid-template-columns: repeat(${columns}, ${settings.labelWidth}mm); column-gap: ${settings.horizontalGap}mm; justify-content: center; align-items: start; page-break-after: always; break-after: page; overflow: hidden; }
      .label-row:last-of-type { page-break-after: auto; break-after: auto; }
      .label { width: ${settings.labelWidth}mm; height: ${settings.labelHeight}mm; padding: 1mm; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: .4mm; overflow: hidden; }
      .label.empty { visibility: hidden; }
      .brand { font-size: 5pt; line-height: 1; font-weight: 700; letter-spacing: .2mm; }
      svg { display: block; width: 100%; height: 13mm; flex: none; fill: #000; }
      .code { font-size: 6.5pt; line-height: 1; font-weight: 700; letter-spacing: .1mm; }
      @media screen { body { padding: 12px; background: #e5e7eb; } .label-row { margin: 0 auto 12px; background: #fff; box-shadow: 0 2px 12px #0002; } }
    </style></head><body>${labels}<script>window.onload=()=>{window.focus();window.print()}</script></body></html>`);
  popup.document.close();
  return true;
}

function fullCode(prefix: string, number: number, width: number) {
  return `${prefix}${String(number).padStart(width, "0")}`;
}

export default function BarcodePrintPage() {
  const [overview, setOverview] = useState<BarcodePrintOverview | null>(null);
  const [role, setRole] = useState("");
  const [firstCode, setFirstCode] = useState("MTK2026000001");
  const [quantity, setQuantity] = useState("1");
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [sizePreset, setSizePreset] = useState("32x25");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [action, setAction] = useState<"SKIP" | "REPRINT">("SKIP");
  const [startCode, setStartCode] = useState("");
  const [reason, setReason] = useState("");
  const [job, setJob] = useState<BarcodePrintJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canApprove = APPROVER_ROLES.has(role);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getBarcodePrintOverview();
      setOverview(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load barcode printing.");
    }
  }, []);

  useEffect(() => {
    const settingsTimer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem("authUser");
        if (stored) setRole(String(JSON.parse(stored)?.role ?? "").toUpperCase());
        const savedPrinterSettings = localStorage.getItem("mtkBarcodePrinterSettings");
        if (savedPrinterSettings) {
          const parsed = JSON.parse(savedPrinterSettings) as Partial<PrinterSettings>;
          const loaded = {
            labelWidth: Number(parsed.labelWidth ?? DEFAULT_PRINTER_SETTINGS.labelWidth),
            labelHeight: Number(parsed.labelHeight ?? DEFAULT_PRINTER_SETTINGS.labelHeight),
            horizontalGap: Number(parsed.horizontalGap ?? DEFAULT_PRINTER_SETTINGS.horizontalGap),
            verticalGap: Number(parsed.verticalGap ?? DEFAULT_PRINTER_SETTINGS.verticalGap),
          };
          setPrinterSettings(loaded);
          setSizePreset(presetFor(loaded.labelWidth, loaded.labelHeight));
        }
      } catch { setRole(""); }
    }, 0);
    const loadTimer = window.setTimeout(() => void load(), 0);
    return () => {
      window.clearTimeout(settingsTimer);
      window.clearTimeout(loadTimer);
    };
  }, [load]);

  const layout = useMemo(() => encodePrinterSettings(printerSettings), [printerSettings]);

  const pendingRequests = useMemo(
    () => overview?.requests.filter((item) => item.status === "PENDING") ?? [],
    [overview],
  );

  async function handleConfigure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const result = await configureBarcodeSequence(firstCode);
      setNotice(`Barcode sequence configured. First available: ${result.nextCode}`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the barcode sequence.");
    } finally { setBusy(false); }
  }

  async function handleGenerate() {
    setBusy(true); setError(""); setNotice(""); setJob(null);
    try {
      const result = await generateBarcodeLabels(Number(quantity), layout);
      setJob(result);
      setNotice(`${result.codes.length} label numbers reserved: ${result.codes[0]} – ${result.codes[result.codes.length - 1]}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reserve barcode labels.");
    } finally { setBusy(false); }
  }

  async function handleAuthorization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await requestBarcodeAuthorization({ action, startCode, quantity: Number(quantity), layout, reason });
      setStartCode(""); setReason("");
      setNotice("Authorization request submitted. A manager must approve before these labels can be printed.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not submit the request.");
    } finally { setBusy(false); }
  }

  async function handleDecision(request: BarcodeAuthorizationRequest, decision: "APPROVE" | "REJECT") {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await decideBarcodeAuthorization(request.id, decision);
      if (decision === "APPROVE" && result.batch) {
        setJob(result.batch);
        setNotice(`Approved. ${result.batch.codes.length} labels are ready; print them from the button below.`);
      } else {
        setNotice(decision === "APPROVE" ? "Request approved." : "Request rejected.");
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the authorization request.");
    } finally { setBusy(false); }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <PageTitle title="Barcode Printing" subtitle="Create MTK barcode sticker batches and review authorized skip or reprint requests." />

        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}
        {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"><Check size={18} className="mt-0.5 shrink-0" />{notice}</div>}

        {overview && !overview.configured && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3"><Settings2 className="text-emerald-700" /><div><h2 className="text-lg font-bold text-slate-900">Set the first barcode number</h2><p className="text-sm text-slate-500">Admin, Boss, or Manager sets this once. The last six digits become the sequence.</p></div></div>
            {canApprove ? <form onSubmit={handleConfigure} className="flex flex-col gap-3 sm:flex-row"><input value={firstCode} onChange={(event) => setFirstCode(event.target.value.toUpperCase())} placeholder="MTK2026000001" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 font-mono" required /><button disabled={busy} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Set first barcode"}</button></form> : <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Ask an Admin, Boss, or Manager to set the starting barcode number.</p>}
          </section>
        )}

        {overview?.configured && overview.configuration && (
          <>
            <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3"><Barcode className="text-emerald-700" size={22} /><div><h2 className="text-lg font-bold text-slate-900">Print the next numbers</h2><p className="text-sm text-slate-500">Next available: <strong className="font-mono text-slate-800">{overview.configuration.nextCode}</strong></p></div></div>
                <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Quantity<input type="number" min="1" max="500" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><div className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-xs font-semibold text-slate-500">Current label setup</p><p className="mt-1 text-sm font-bold text-slate-800">{describeLayout(layout)}</p></div></div>
                <button onClick={handleGenerate} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><Printer size={18} />{busy ? "Preparing…" : "Generate next barcode labels"}</button>
                <p className="mt-3 text-xs text-slate-500">Numbers are reserved when generated. If printing fails, request an authorized reprint instead of generating them again.</p>
              </div>

              <form onSubmit={handleAuthorization} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3"><Clock3 className="text-amber-600" size={21} /><div><h2 className="text-lg font-bold text-slate-900">Authorize Print</h2><p className="text-sm text-slate-500">Request approval to skip ahead or reprint an issued range.</p></div></div>
                <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Request type<select value={action} onChange={(event) => setAction(event.target.value as "SKIP" | "REPRINT")} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="SKIP">Skip ahead</option><option value="REPRINT">Reprint existing numbers</option></select></label><label className="text-sm font-semibold text-slate-700">First number<input value={startCode} onChange={(event) => setStartCode(event.target.value.toUpperCase())} placeholder={overview.configuration.nextCode} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono" required /></label></div>
                <label className="mt-3 block text-sm font-semibold text-slate-700">Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} maxLength={500} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5" required /></label>
                <button disabled={busy} className="mt-4 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50">Submit for approval</button>
              </form>
            </section>

            {job && <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-bold text-slate-900">Labels ready to print</h2><p className="font-mono text-sm text-slate-600">{job.codes[0]} — {job.codes[job.codes.length - 1]} · {job.codes.length} labels · {describeLayout(job.layout)}</p></div><button onClick={() => { if (!printLabels(job)) setError("Allow pop-ups for this dashboard, then press Print labels again."); }} className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"><Printer size={17} />Print labels</button></div><div className="mt-4 flex max-h-28 flex-wrap gap-2 overflow-y-auto">{job.codes.slice(0, 30).map((code) => <span key={code} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">{code}</span>)}{job.codes.length > 30 && <span className="px-2 py-1 text-xs text-slate-500">and {job.codes.length - 30} more</span>}</div></section>}

            {canApprove && <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="text-lg font-bold text-slate-900">Pending authorization requests</h2><p className="text-sm text-slate-500">The requester cannot approve their own request.</p></div>{pendingRequests.length ? <div className="divide-y divide-slate-100">{pendingRequests.map((request) => <div key={request.id} className="flex flex-col justify-between gap-3 p-5 lg:flex-row lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{request.action === "SKIP" ? "SKIP AHEAD" : "REPRINT"}</span><span className="font-mono font-semibold text-slate-800">{request.startCode} — {request.endCode}</span><span className="text-xs text-slate-500">{request.quantity} labels · {describeLayout(request.layout)}</span></div><p className="mt-1 text-sm text-slate-600">Reason: {request.reason}</p><p className="mt-1 text-xs text-slate-400">Requested {new Date(request.createdAt).toLocaleString()}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => void handleDecision(request, "REJECT")} disabled={busy} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Reject</button><button onClick={() => void handleDecision(request, "APPROVE")} disabled={busy} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve</button></div></div>)}</div> : <p className="p-6 text-sm text-slate-500">There are no pending requests.</p>}</section>}

            {overview.requests.some((request) => request.status !== "PENDING") && <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="text-lg font-bold text-slate-900">Authorization history</h2><p className="text-sm text-slate-500">Approved and rejected skip/reprint requests.</p></div><div className="divide-y divide-slate-100">{overview.requests.filter((request) => request.status !== "PENDING").map((request) => <div key={request.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${request.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{request.status}</span><span className="text-xs font-bold text-slate-500">{request.action === "SKIP" ? "SKIP AHEAD" : "REPRINT"}</span><span className="font-mono text-sm text-slate-800">{request.startCode} — {request.endCode}</span></div><p className="mt-1 text-sm text-slate-600">Reason: {request.reason}</p>{request.action === "SKIP" && request.expectedNextNumber !== null && request.expectedNextNumber !== undefined && request.startNumber > request.expectedNextNumber && <p className="mt-1 text-xs text-amber-700">Skipped sequence: {fullCode(request.prefix, request.expectedNextNumber, request.numberWidth)} – {fullCode(request.prefix, request.startNumber - 1, request.numberWidth)}</p>}{request.decisionNote && <p className="mt-1 text-xs text-slate-500">Decision note: {request.decisionNote}</p>}</div><time className="shrink-0 text-xs text-slate-400">{request.decidedAt ? new Date(request.decidedAt).toLocaleString() : new Date(request.createdAt).toLocaleString()}</time></div>)}</div></section>}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="text-lg font-bold text-slate-900">Barcode print history</h2><p className="text-sm text-slate-500">Latest 50 print batches. Reprinting a past range always requires authorization.</p></div>{overview.batches.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Type</th><th className="px-5 py-3">Barcode range</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Sticker size</th><th className="px-5 py-3">Created</th></tr></thead><tbody className="divide-y divide-slate-100">{overview.batches.map((batch) => <tr key={batch.id}><td className="px-5 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{batch.kind}</span></td><td className="px-5 py-3 font-mono text-slate-800">{batch.startCode} — {batch.endCode}</td><td className="px-5 py-3">{batch.endNumber - batch.startNumber + 1}</td><td className="px-5 py-3">{describeLayout(batch.layout)}</td><td className="px-5 py-3 text-slate-500">{new Date(batch.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-slate-500">No barcodes have been printed yet.</p>}</section>

            <details className="rounded-2xl border border-slate-200 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center gap-2 p-5 font-bold text-slate-900"><SlidersHorizontal size={18} className="text-slate-600" />Printer Settings <span className="ml-auto text-xs font-normal text-slate-500">Saved on this computer</span></summary><div className="border-t border-slate-100 p-5"><p className="mb-4 text-sm text-slate-600">Roll width is fixed at 4 inches (101.6 mm). Choose a sticker size; the number that fits across is calculated automatically.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><div className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-xs font-semibold text-slate-500">Fixed roll width</p><p className="mt-1 font-bold text-slate-800">4 inch · 101.6 mm</p></div><label className="text-sm font-semibold text-slate-700">Sticker preset<select value={sizePreset} onChange={(event) => { const preset = event.target.value; setSizePreset(preset); setSettingsSaved(false); if (preset === "32x25") setPrinterSettings((current) => ({ ...current, labelWidth: 32, labelHeight: 25 })); else if (preset === "2x1in") setPrinterSettings((current) => ({ ...current, labelWidth: 50.8, labelHeight: 25.4 })); else if (preset === "1x1in") setPrinterSettings((current) => ({ ...current, labelWidth: 25.4, labelHeight: 25.4 })); }} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="32x25">32 × 25 mm</option><option value="2x1in">2 × 1 inch (50.8 × 25.4 mm)</option><option value="1x1in">1 × 1 inch (25.4 × 25.4 mm)</option><option value="custom">Custom size</option></select></label><div className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-xs font-semibold text-slate-500">Labels across</p><p className="mt-1 font-bold text-slate-800">{getColumns(printerSettings)} per row</p></div><label className="text-sm font-semibold text-slate-700">Sticker width (mm)<input type="number" step="0.1" min="10" max="100" value={printerSettings.labelWidth} onChange={(event) => { setSizePreset("custom"); setSettingsSaved(false); setPrinterSettings((current) => ({ ...current, labelWidth: Number(event.target.value) })); }} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold text-slate-700">Sticker height (mm)<input type="number" step="0.1" min="8" max="100" value={printerSettings.labelHeight} onChange={(event) => { setSizePreset("custom"); setSettingsSaved(false); setPrinterSettings((current) => ({ ...current, labelHeight: Number(event.target.value) })); }} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold text-slate-700">Gap between stickers (mm)<input type="number" step="0.1" min="0" max="5" value={printerSettings.horizontalGap} onChange={(event) => { setSettingsSaved(false); setPrinterSettings((current) => ({ ...current, horizontalGap: Number(event.target.value) })); }} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold text-slate-700">Gap between rows (mm)<input type="number" step="0.1" min="0" max="10" value={printerSettings.verticalGap} onChange={(event) => { setSettingsSaved(false); setPrinterSettings((current) => ({ ...current, verticalGap: Number(event.target.value) })); }} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label></div><div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={() => { localStorage.setItem("mtkBarcodePrinterSettings", JSON.stringify(printerSettings)); setSettingsSaved(true); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Save printer settings</button><button onClick={() => { setPrinterSettings(DEFAULT_PRINTER_SETTINGS); setSizePreset("32x25"); localStorage.removeItem("mtkBarcodePrinterSettings"); setSettingsSaved(true); }} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Reset sticker size</button>{settingsSaved && <span role="status" className="text-sm font-medium text-emerald-700">Settings saved for this computer.</span>}</div><p className="mt-3 text-xs text-slate-500">Choose 2 × 1 inch or 1 × 1 inch when you change sticker rolls; the 4-inch backing stays fixed. Settings are saved in this browser and can be changed later.</p></div></details>
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600"><strong>Code 39 barcode labels.</strong> Choose the TSC sticker printer in the browser print dialog and confirm its media width and gap calibration match these settings. Skips and reprints require approval and are recorded.</section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
