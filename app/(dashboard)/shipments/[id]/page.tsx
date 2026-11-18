"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Printer, X } from "lucide-react";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import {
  assignShipmentSerials,
  correctShipmentSerialRange,
  getShipment,
  getWarrantyExtensionRequestsForShipment,
  reviewWarrantyExtensionRequest,
  updateShipmentWarrantyReminderDays,
  type Product,
  type Shipment,
  type ShipmentSerial,
  type WarrantyExtensionRequest,
} from "@/lib/api";
import { getCurrentAuthUser } from "@/lib/current-user";
import { printThermalReceipt } from "@/lib/thermalReceipt";

function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

function normalizeSerialInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 9);
}

function formatSerial(value: string) {
  return normalizeSerialInput(value).replace(/(\d{3})(?=\d)/g, '$1 ');
}

function addMonths(value: string | null | undefined, months: number) {
  if (!value || !Number.isFinite(months)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  date.setUTCDate(Math.min(day, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()));
  return date.toISOString();
}

function earlierDate(first: string | null, second: string | null) {
  if (!first) return second;
  if (!second) return first;
  return new Date(first).getTime() <= new Date(second).getTime() ? first : second;
}

function getWarrantyDates(
  serial: ShipmentSerial,
  product: Product | undefined,
  shipmentDate: string,
) {
  const policyCode = (product?.warrantyPolicyCode ?? product?.warrantyPolicy?.code ?? "").toUpperCase();
  const months = product?.warrantyPolicyMonths ?? product?.warrantyPolicy?.warrantyMonths ?? product?.warrantyMonths ?? 12;
  const shipmentIsComplete =
    serial.status === "SHIPPED" || serial.status === "REGISTERED";
  const purchaseDate =
    serial.shippedAt ?? (shipmentIsComplete ? shipmentDate : null);

  if (policyCode === "A") {
    return { start: purchaseDate, end: addMonths(purchaseDate, months) };
  }

  if (policyCode === "B" || policyCode === "C") {
    const registrationDeadlineMonths = product?.warrantyRegistrationDeadlineMonths ?? product?.warrantyPolicy?.registrationDeadlineMonths ?? 12;
    const start = purchaseDate;
    const end = serial.warranty
      ? earlierDate(
          addMonths(serial.warranty.registerDate, months),
          addMonths(purchaseDate, months + registrationDeadlineMonths),
        )
      : addMonths(purchaseDate, months);
    return { start, end };
  }

  if (policyCode === "D" || policyCode === "E") {
    return {
      start: serial.warranty?.warrantyStart ?? null,
      end: serial.warranty?.warrantyEnd ?? null,
    };
  }

  return {
    start: serial.warranty?.warrantyStart ?? (product?.warrantyStartRule === "DEALER_PURCHASE" ? purchaseDate : null),
    end: serial.warranty?.warrantyEnd ?? (product?.warrantyStartRule === "DEALER_PURCHASE" ? addMonths(purchaseDate, months) : null),
  };
}

function getSerialStatusLabel(serial: ShipmentSerial) {
  if (serial.warranty && serial.status !== "REPLACED") {
    return "Registered";
  }

  switch (serial.status) {
    case "SHIPPED":
      return "Dealer stock";
    case "REGISTERED":
      return "Registered";
    case "REPLACED":
      return "Replaced";
    case "RETURNED":
      return "Returned";
    case "SERVICE_ISSUED":
      return "Issued for service";
    case "IN_STOCK":
      return "In stock";
    default:
      return serial.status.replace(/_/g, " ");
  }
}

export default function ShipmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const shipmentId = params.id;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [serialInput, setSerialInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reminderDays, setReminderDays] = useState(30);
  const [savingReminder, setSavingReminder] = useState(false);
  const [extensionRequests, setExtensionRequests] = useState<WarrantyExtensionRequest[]>([]);
  const [reviewingExtension, setReviewingExtension] = useState("");
  const [canCorrectShipmentSerials, setCanCorrectShipmentSerials] = useState(false);
  const [editingSerialItemId, setEditingSerialItemId] = useState("");
  const [correctionStartSerial, setCorrectionStartSerial] = useState("");
  const [correctionEndSerial, setCorrectionEndSerial] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [savingSerialCorrection, setSavingSerialCorrection] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const role = String(getCurrentAuthUser()?.role ?? "").toUpperCase();
    setCanCorrectShipmentSerials(["ADMIN", "BOSS", "MANAGER"].includes(role));

    async function loadShipment() {
      try {
        setLoading(true);
        setError("");
        const [data, requests] = await Promise.all([
          getShipment(shipmentId),
          getWarrantyExtensionRequestsForShipment(shipmentId),
        ]);
        if (!cancelled) {
          setShipment(data);
          setReminderDays(data.warrantyReminderDays ?? 30);
          setExtensionRequests(requests);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load shipment.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (shipmentId) loadShipment();
    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  async function decideExtensionRequest(request: WarrantyExtensionRequest, approved: boolean) {
    const action = approved ? "ခွင့်ပြု" : "ပယ်ချ";
    if (!window.confirm(`${request.items.length} serial ပါသော G/H သက်တမ်းတိုးတောင်းဆိုမှုကို ${action}မလား?`)) return;
    try {
      setReviewingExtension(request.id);
      setError("");
      await reviewWarrantyExtensionRequest(request.id, approved);
      setExtensionRequests(await getWarrantyExtensionRequestsForShipment(shipmentId));
      setSuccess(approved ? "G/H stock အာမခံတစ်နှစ်တိုးရန် ခွင့်ပြုပြီးပါပြီ။" : "သက်တမ်းတိုးတောင်းဆိုမှုကို ပယ်ချပြီးပါပြီ။");
    } catch (err) {
      setError(err instanceof Error ? err.message : "တောင်းဆိုမှုကို ဆုံးဖြတ်မရပါ။");
    } finally {
      setReviewingExtension("");
    }
  }

  async function saveReminderDays() {
    if (!shipment) return;
    try {
      setSavingReminder(true);
      setError("");
      setSuccess("");
      const updated = await updateShipmentWarrantyReminderDays(shipment.id, reminderDays);
      setShipment((current) => current ? { ...current, warrantyReminderDays: updated.warrantyReminderDays } : current);
      setSuccess("G/H stock reminder ကို သိမ်းပြီးပါပြီ။");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reminder setting ကို သိမ်းမရပါ။");
    } finally {
      setSavingReminder(false);
    }
  }

  async function handleAssignSerials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shipment) return;

    const serialNumbers = serialInput
      .split(/[\n,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (serialNumbers.length === 0) {
      setError("Enter at least one serial number.");
      return;
    }

    const confirmed = window.confirm(
      `Assign ${serialNumbers.length} serial(s) to ${shipment.shipmentNo} for ${shipment.dealer?.dealerCode ?? "this dealer"}? This will mark the serials as SHIPPED and complete the shipment.`,
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await assignShipmentSerials(
        shipment.id,
        serialNumbers,
      );

      setShipment(result.shipment);
      setSerialInput("");
      setSuccess(
        `${result.count} serial(s) assigned to ${shipment.shipmentNo}. Shipment completed.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to assign serials to shipment.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openSerialCorrection(item: NonNullable<Shipment["items"]>[number]) {
    const serials = [...(item.serials ?? [])].sort((a, b) => a.serialNumber.localeCompare(b.serialNumber));
    if (serials.length === 0) return;
    setEditingSerialItemId(item.id);
    setCorrectionStartSerial(serials[0].serialNumber);
    setCorrectionEndSerial(serials[serials.length - 1].serialNumber);
    setCorrectionReason("");
    setError("");
    setSuccess("");
  }

  async function saveSerialCorrection(event: FormEvent<HTMLFormElement>, item: NonNullable<Shipment["items"]>[number]) {
    event.preventDefault();
    if (!shipment) return;

    const start = normalizeSerialInput(correctionStartSerial);
    const end = normalizeSerialInput(correctionEndSerial);
    const expectedCount = item.serials?.length ?? 0;
    const actualCount = start.length === 9 && end.length === 9
      ? Number(end) - Number(start) + 1
      : 0;

    if (actualCount !== expectedCount || correctionReason.trim().length < 10) {
      setError(`Serial အရေအတွက်ကို ${expectedCount} လုံးတိတိထားပြီး အကြောင်းပြချက်ကို အနည်းဆုံး ၁၀ လုံးရေးပါ။`);
      return;
    }

    const sortedCurrent = [...(item.serials ?? [])].sort((a, b) => a.serialNumber.localeCompare(b.serialNumber));
    const oldRange = `${formatSerial(sortedCurrent[0]?.serialNumber ?? "")} – ${formatSerial(sortedCurrent[sortedCurrent.length - 1]?.serialNumber ?? "")}`;
    const newRange = `${formatSerial(start)} – ${formatSerial(end)}`;
    if (!window.confirm(
      `${shipment.shipmentNo} မှာ serial ${expectedCount} လုံးကို\n${oldRange}\nမှ\n${newRange}\nသို့ ပြောင်းပါမယ်။ အဟောင်းတွေ warehouse stock ထဲပြန်ဝင်ပြီး အသစ်တွေကို ဒီ shipment ထဲသတ်မှတ်ပါမယ်။ ဆက်လုပ်မလား?`,
    )) return;

    try {
      setSavingSerialCorrection(true);
      setError("");
      setSuccess("");
      const result = await correctShipmentSerialRange(shipment.id, {
        shipmentItemId: item.id,
        startSerial: start,
        endSerial: end,
        reason: correctionReason.trim(),
      });
      setShipment(await getShipment(shipment.id));
      setEditingSerialItemId("");
      setSuccess(`${result.newSerialNumbers.length} serial များကို ${shipment.shipmentNo} မှာ ပြင်ဆင်ပြီးပါပြီ။`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Shipment serial များကို ပြင်မရပါ။");
    } finally {
      setSavingSerialCorrection(false);
    }
  }

  function printShipmentReceipt() {
    if (!shipment) return;
    const opened = printThermalReceipt({
      brand: "Suntree Myanmar",
      title: "DEALER STOCK ISSUE",
      number: shipment.shipmentNo,
      date: formatDate(shipment.shipmentDate),
      recipientLabel: "Dealer",
      recipient: `${shipment.dealer?.dealerCode ?? shipment.dealerId} · ${shipment.dealer?.companyName ?? "Dealer"}`,
      status: shipment.status,
      note: shipment.remarks,
      lines: (shipment.items ?? []).flatMap((item) => {
        const serials = item.serials ?? [];
        if (serials.length) {
          return serials.map((serial) => ({
            name: item.product?.name ?? "Product",
            code: item.product?.productCode,
            serial: serial.serialNumber,
            quantity: 1,
          }));
        }
        return [{
          name: item.product?.name ?? "Product",
          code: item.product?.productCode,
          quantity: item.quantity,
        }];
      }),
    });
    if (!opened) window.alert("Allow pop-ups for this dashboard to print the receipt.");
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          <Link
            href="/shipments"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            ← Back to Shipments
          </Link>
          <div className="mt-3">
            <PageTitle
              title="Shipment Details"
              subtitle="Review the dealer shipment and assign existing warehouse serials."
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Loading shipment...
          </div>
        ) : shipment ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">
                  {shipment.shipmentNo}
                </h2>
                <button type="button" onClick={printShipmentReceipt} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
                  <Printer size={17} /> Print 80 mm Receipt
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase text-slate-500">Dealer</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {shipment.dealer?.dealerCode ?? shipment.dealerId} · {shipment.dealer?.companyName ?? "Dealer"}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase text-slate-500">Shipment Date</div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {new Date(shipment.shipmentDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase text-slate-500">Status</div>
                  <div className="mt-1 font-semibold text-slate-900">{shipment.status}</div>
                </div>
              </div>
              {shipment.remarks && (
                <p className="mt-4 text-sm text-slate-600">Remarks: {shipment.remarks}</p>
              )}
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <h2 className="font-bold text-amber-950">G/H stock warranty reminder</h2>
                  <p className="mt-1 text-sm leading-6 text-amber-900">ဒီ Shipment ထဲက G/H policy ပစ္စည်းများအတွက် ပထမနှစ်ကုန်ခါနီး Dealer နှင့် ဝန်ထမ်း dashboard နှစ်ဖက်လုံးတွင် သတိပေးမည့် ရက်အရေအတွက်ကို သတ်မှတ်ပါ။ Reminder ပေါ်ချိန်တွင် Dealer က တောင်းဆိုနိုင်ပြီး ဝန်ထမ်းက ဒီ Shipment မှ ဆက်စစ်အတည်ပြုနိုင်ပါသည်။</p>
                </div>
                <div className="flex shrink-0 items-end gap-2">
                  <label className="text-xs font-semibold text-amber-950">ကြိုတင်ရက်
                    <input type="number" min={0} max={365} value={reminderDays} onChange={(event) => setReminderDays(Number(event.target.value))} className="mt-1 block h-10 w-28 rounded-lg border border-amber-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-amber-500" />
                  </label>
                  <button type="button" onClick={() => void saveReminderDays()} disabled={savingReminder || reminderDays < 0 || reminderDays > 365} className="h-10 rounded-lg bg-amber-700 px-4 text-sm font-bold text-white disabled:opacity-50">{savingReminder ? "သိမ်းနေသည်…" : "သိမ်းမည်"}</button>
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-800">၀ ထည့်ပါက Reminder မပြပါ။ Dealer က ပထမနှစ်အတွင်း ကိုယ်တိုင်တောင်းဆိုနိုင်သေးသည်။ လက်ရှိသတ်မှတ်ချက်: {shipment.warrantyReminderDays ?? 30} ရက် ကြိုတင်</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-bold text-slate-900">G/H သက်တမ်းတိုးတောင်းဆိုမှုများ</h2><p className="mt-1 text-xs text-slate-500">ဒီ Shipment ထဲက serial များအတွက် Dealer ပို့ထားသော တောင်းဆိုမှုစာရင်း</p></div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{extensionRequests.filter((request) => request.status === "PENDING").length} ဆိုင်းငံ့</span>
              </div>
              {extensionRequests.length === 0 ? <p className="mt-3 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">တောင်းဆိုမှု မရှိသေးပါ။</p> : (
                <div className="mt-3 space-y-3">
                  {extensionRequests.map((request) => <article key={request.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold text-slate-800">{request.dealer.dealerCode} · {request.dealer.companyName}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(request.requestedAt).toLocaleString()} · {request.items.length} serial(s)</p>{request.dealerNote && <p className="mt-1 text-xs text-slate-600">မှတ်ချက်: {request.dealerNote}</p>}</div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${request.status === "PENDING" ? "bg-amber-100 text-amber-800" : request.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{request.status}</span></div>
                    <div className="mt-3 flex flex-wrap gap-2">{request.items.map(({ serial }) => <span key={serial.serialNumber} className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs text-slate-700">{serial.serialNumber}</span>)}</div>
                    {request.status === "PENDING" && <div className="mt-3 flex justify-end gap-2"><button type="button" disabled={Boolean(reviewingExtension)} onClick={() => void decideExtensionRequest(request, false)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">ပယ်ချ</button><button type="button" disabled={Boolean(reviewingExtension)} onClick={() => void decideExtensionRequest(request, true)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{reviewingExtension === request.id ? "သိမ်းနေသည်…" : "၁ နှစ်တိုးခွင့်ပြု"}</button></div>}
                  </article>)}
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Purchased products and serials
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Current serial status, warranty type and dates, and any replacement records from Serial Management.
                </p>
              </div>

              {(shipment.items ?? []).length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No products or serials have been assigned to this shipment yet.
                </div>
              ) : (
                (shipment.items ?? []).map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {item.product?.name ?? "Product"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xs text-slate-500">
                          {item.product?.productCode ?? "—"} · {item.serials?.length ?? 0} serial(s)
                        </p>
                        {canCorrectShipmentSerials && shipment.status === "COMPLETED" && (item.serials?.length ?? 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => editingSerialItemId === item.id ? setEditingSerialItemId("") : openSerialCorrection(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Serial range ပြင်ရန်
                          </button>
                        )}
                      </div>
                    </div>

                    {(item.serials ?? []).length === 0 ? (
                      <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">
                        No serial numbers are assigned to this product line.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[850px] text-left text-xs">
                          <thead className="bg-slate-50 uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Serial</th>
                              <th className="px-3 py-2 font-semibold">Status</th>
                              <th className="px-3 py-2 font-semibold">Shipped</th>
                              <th className="px-3 py-2 font-semibold">Type</th>
                              <th className="px-3 py-2 font-semibold">W-start</th>
                              <th className="px-3 py-2 font-semibold">W-end</th>
                              <th className="px-3 py-2 font-semibold">Replacement</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(item.serials ?? []).map((serial) => {
                              const warrantyDates = getWarrantyDates(serial, item.product, shipment.shipmentDate);
                              const replacementRecords = [
                                ...(serial.oldReplacementItems ?? []).map((record) =>
                                  `${record.replacementSerial?.serialNumber
                                    ? `with ${record.replacementSerial.serialNumber.replace(/(\d{3})(?=\d)/g, "$1 ")}`
                                    : "replacement requested"} · ${record.return.status} · ${formatDate(record.return.createdAt)}`,
                                ),
                                ...(serial.newReplacementItems ?? []).map((record) =>
                                  `from ${record.oldSerial.serialNumber.replace(/(\d{3})(?=\d)/g, "$1 ")} · ${record.return.status} · ${formatDate(record.return.createdAt)}`,
                                ),
                              ];

                              return (
                                <tr key={serial.id} className="whitespace-nowrap bg-white text-slate-700">
                                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                                    {serial.serialNumber.replace(/(\d{3})(?=\d)/g, "$1 ")}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className={`rounded-full px-2.5 py-1 font-semibold ${
                                      serial.status === "SHIPPED" && !serial.warranty
                                        ? "bg-amber-100 text-amber-800"
                                        : serial.status === "REPLACED"
                                          ? "bg-violet-100 text-violet-800"
                                          : serial.warranty
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-slate-100 text-slate-700"
                                    }`}>
                                      {getSerialStatusLabel(serial)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {formatDate(serial.shippedAt ?? shipment.shipmentDate)}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {item.product?.warrantyPolicyCode ?? item.product?.warrantyPolicy?.code ?? "—"}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {formatDate(warrantyDates.start)}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {formatDate(warrantyDates.end)}
                                  </td>
                                  <td className="max-w-[280px] truncate px-3 py-2.5" title={replacementRecords.join("; ")}>
                                    {replacementRecords.join("; ") || "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {editingSerialItemId === item.id && (
                      <form
                        onSubmit={(event) => saveSerialCorrection(event, item)}
                        className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4"
                      >
                        <div>
                          <h4 className="font-semibold text-slate-900">Shipment serial range ပြင်ဆင်ရန်</h4>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            လက်ရှိ {item.serials?.length ?? 0} လုံးကို အရေအတွက်တူညီသော warehouse ထဲက serial အသစ်ဖြင့် အစားထိုးပါမည်။ သုံးပြီးသား serial များကို စနစ်က လက်မခံပါ။
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="space-y-1 text-xs font-semibold text-slate-700">
                            <span>အစ serial</span>
                            <input
                              value={correctionStartSerial}
                              onChange={(event) => setCorrectionStartSerial(event.target.value)}
                              onBlur={() => setCorrectionStartSerial(formatSerial(correctionStartSerial))}
                              inputMode="numeric"
                              autoComplete="off"
                              placeholder="000 000 749"
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                            />
                          </label>
                          <label className="space-y-1 text-xs font-semibold text-slate-700">
                            <span>အဆုံး serial</span>
                            <input
                              value={correctionEndSerial}
                              onChange={(event) => setCorrectionEndSerial(event.target.value)}
                              onBlur={() => setCorrectionEndSerial(formatSerial(correctionEndSerial))}
                              inputMode="numeric"
                              autoComplete="off"
                              placeholder="000 000 758"
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                            />
                          </label>
                        </div>
                        <label className="block space-y-1 text-xs font-semibold text-slate-700">
                          <span>ပြင်ဆင်ရသည့်အကြောင်းရင်း</span>
                          <textarea
                            value={correctionReason}
                            onChange={(event) => setCorrectionReason(event.target.value)}
                            rows={2}
                            maxLength={500}
                            placeholder="ဥပမာ - shipment တွင် serial range မှားထည့်မိ၍ အမှန်အတိုင်းပြင်ဆင်ခြင်း"
                            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingSerialItemId("")}
                            disabled={savingSerialCorrection}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" /> ပယ်ဖျက်
                          </button>
                          <button
                            type="submit"
                            disabled={savingSerialCorrection || normalizeSerialInput(correctionStartSerial).length !== 9 || normalizeSerialInput(correctionEndSerial).length !== 9 || correctionReason.trim().length < 10}
                            className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingSerialCorrection ? "ပြင်ဆင်နေသည်…" : "အတည်ပြုပြင်ရန်"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))
              )}
            </section>

            {shipment.status === "DRAFT" ? (
              <form
                onSubmit={handleAssignSerials}
                className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Assign Existing Serials</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Enter one in-stock serial per line. All serials must belong to an active product and must not already be shipped.
                  </p>
                </div>
                <textarea
                  value={serialInput}
                  onChange={(event) => setSerialInput(event.target.value)}
                  rows={8}
                  placeholder={"000 000 012\n000 000 013\n000 000 014"}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Assigning..." : "Assign Serials & Complete Shipment"}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-medium text-emerald-800">
                This shipment is {shipment.status}. Its serial assignments are complete.
              </div>
            )}
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}
