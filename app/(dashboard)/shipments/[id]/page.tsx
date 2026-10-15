"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import {
  assignShipmentSerials,
  getShipment,
  type Product,
  type Shipment,
  type ShipmentSerial,
} from "@/lib/api";
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
  const purchaseDate = serial.shippedAt ?? shipmentDate;

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

  useEffect(() => {
    let cancelled = false;

    async function loadShipment() {
      try {
        setLoading(true);
        setError("");
        const data = await getShipment(shipmentId);
        if (!cancelled) setShipment(data);
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
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {item.product?.name ?? "Product"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {item.product?.productCode ?? "—"} · {item.serials?.length ?? 0} serial(s)
                      </p>
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
