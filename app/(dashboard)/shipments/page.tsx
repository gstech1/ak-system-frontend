"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";

import {
  createShipment,
  deleteShipment,
  getShipments,
  type Shipment,
} from "@/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5001";

type Dealer = {
  id: string;
  dealerCode: string;
  companyName: string;
  ownerName: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  township: string;
  stateRegion: string;
  status: "ACTIVE" | "INACTIVE";
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
};

export default function ShipmentsPage() {
  const [shipments, setShipments] =
    useState<Shipment[]>([]);

  const [dealers, setDealers] =
    useState<Dealer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [shipmentNo, setShipmentNo] =
    useState("");

  const [dealerId, setDealerId] =
    useState("");

  const [shipmentDate, setShipmentDate] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1,
    ).padStart(2, "0");
    const day = String(
      today.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("accessToken");

      if (!token) {
        throw new Error(
          "Login session not found. Please login again.",
        );
      }

      const [
        shipmentResponse,
        dealerResponse,
      ] = await Promise.all([
        getShipments(),

        fetch(`${API_BASE_URL}/dealers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }),
      ]);

      const dealerData =
        await dealerResponse
          .json()
          .catch(() => null);

      if (!dealerResponse.ok) {
        throw new Error(
          dealerData?.message ||
            `Failed to load dealers (${dealerResponse.status})`,
        );
      }

      setShipments(shipmentResponse);

      setDealers(
        Array.isArray(dealerData)
          ? dealerData
          : [],
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load shipments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setShipmentNo("");
    setDealerId("");
    setShipmentDate(
      getTodayDate(),
    );
    setRemarks("");
  }

  async function handleCreate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!shipmentNo.trim()) {
      setError(
        "Shipment number is required.",
      );
      return;
    }

    if (!dealerId) {
      setError(
        "Please select a dealer.",
      );
      return;
    }

    if (!shipmentDate) {
      setError(
        "Shipment date is required.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createShipment({
        shipmentNo:
          shipmentNo.trim(),
        dealerId,
        shipmentDate,
        remarks:
          remarks.trim() || undefined,
      });

      setSuccess(
        "Shipment created successfully.",
      );

      resetForm();
      setShowForm(false);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create shipment.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    shipment: Shipment,
  ) {
    if (shipment.status !== "DRAFT") {
      setError(
        "Only DRAFT shipments can be deleted.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Delete shipment ${shipment.shipmentNo}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(shipment.id);
      setError("");
      setSuccess("");

      await deleteShipment(
        shipment.id,
      );

      setSuccess(
        `Shipment ${shipment.shipmentNo} deleted successfully.`,
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete shipment.",
      );
    } finally {
      setDeleting("");
    }
  }

  function getDealerName(
    dealerId: string,
  ) {
    const dealer = dealers.find(
      (item) =>
        item.id === dealerId,
    );

    return (
      dealer?.companyName ||
      dealer?.dealerCode ||
      dealerId
    );
  }

  function formatDate(
    value: string,
  ) {
    return new Date(
      value,
    ).toLocaleDateString();
  }

  function getStatusClass(
    status: string,
  ) {
    switch (status) {
      case "DRAFT":
        return "bg-amber-100 text-amber-700";

      case "SHIPPED":
        return "bg-blue-100 text-blue-700";

      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <PageTitle
            title="Shipments"
            subtitle="Manage dealer shipments and shipment records."
          />

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              resetForm();
              setShowForm(true);
            }}
            className="shrink-0 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
          >
            + Create Shipment
          </button>
        </div>

        {/* Messages */}
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

        {/* Create Form */}
        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create Shipment
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new draft shipment for a dealer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="grid gap-5 md:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Shipment No.
                </label>

                <input
                  type="text"
                  value={shipmentNo}
                  onChange={(event) =>
                    setShipmentNo(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. SHP-2026-001"
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Dealer
                </label>

                <select
                  value={dealerId}
                  onChange={(event) =>
                    setDealerId(
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">
                    Select dealer
                  </option>

                  {dealers.map(
                    (dealer) => (
                      <option
                        key={dealer.id}
                        value={dealer.id}
                      >
                        {dealer.companyName}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Shipment Date
                </label>

                <input
                  type="date"
                  value={shipmentDate}
                  onChange={(event) =>
                    setShipmentDate(
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Today is selected by default. Use the calendar to choose another date.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Remarks
                </label>

                <input
                  type="text"
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(
                      event.target.value,
                    )
                  }
                  placeholder="Optional remarks"
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex justify-end md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Creating..."
                    : "Create Shipment"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Shipment List */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Shipment List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {shipments.length} shipment
              {shipments.length === 1
                ? ""
                : "s"} recorded in the system.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Loading shipments...
            </div>
          ) : shipments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-semibold text-slate-700">
                No shipments found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create a shipment to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Shipment No.
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dealer
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Shipment Date
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Remarks
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {shipments.map(
                    (shipment) => (
                      <tr
                        key={shipment.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-900">
                          {shipment.shipmentNo}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {getDealerName(
                            shipment.dealerId,
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(
                            shipment.shipmentDate,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              shipment.status,
                            )}`}
                          >
                            {shipment.status}
                          </span>
                        </td>

                        <td className="max-w-xs truncate px-6 py-4 text-sm text-slate-600">
                          {shipment.remarks ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {shipment.status ===
                            "DRAFT" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  shipment,
                                )
                              }
                              disabled={
                                deleting ===
                                shipment.id
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deleting ===
                              shipment.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}