"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  approveSerialReject,
  getSerials,
  type Serial,
} from "@/lib/api";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";

export default function RejectApprovalsPage() {
  const [serials, setSerials] = useState<Serial[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPendingRejects() {
    try {
      setLoading(true);
      setError("");

      const response = await getSerials(
        1,
        100,
        "",
        "",
        "REJECT_PENDING",
      );

      setSerials(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reject requests.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(
    serialNumber: string,
  ) {
    try {
      setApproving(serialNumber);
      setError("");
      setSuccess("");

      await approveSerialReject(
        serialNumber,
      );

      setSuccess(
        `Serial ${serialNumber.replace(
          /^(\d{3})(\d{3})(\d{3})$/,
          "$1 $2 $3",
        )} rejected successfully.`,
      );

      await loadPendingRejects();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to approve reject request.",
      );
    } finally {
      setApproving("");
    }
  }

  useEffect(() => {
    loadPendingRejects();
  }, []);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <PageTitle
          title="Reject Approvals"
          subtitle="Review and approve serial rejection requests."
        />

        {/* Messages */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* List */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Pending Reject Requests
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {serials.length} pending request
              {serials.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              Loading reject requests...
            </div>
          ) : serials.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No pending reject requests.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Serial Number
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reason
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Requested
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {serials.map((serial) => (
                    <tr
                      key={serial.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-900">
                        {serial.serialNumber.replace(
                          /^(\d{3})(\d{3})(\d{3})$/,
                          "$1 $2 $3",
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {serial.rejectReason ||
                          "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {serial.rejectedAt
                          ? new Date(
                              serial.rejectedAt,
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                          REJECT PENDING
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleApprove(
                              serial.serialNumber,
                            )
                          }
                          disabled={
                            approving ===
                            serial.serialNumber
                          }
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {approving ===
                          serial.serialNumber
                            ? "Approving..."
                            : "Approve Reject"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}