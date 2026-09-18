"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PermissionGuard from "@/components/auth/PermissionGuard";

type WarrantyPolicy = {
  id: string;
  code: string;
  name: string;
  warrantyMonths: number;
  startRule:
    | "DEALER_PURCHASE"
    | "DEALER_REGISTRATION"
    | "CUSTOMER_SALE";
  registrationRequired: boolean;
  registrationDeadlineMonths?: number | null;
  claimLimit?: number | null;
  replacementLimit?: number | null;
  isActive: boolean;
};

type FormData = {
  code: string;
  name: string;
  warrantyMonths: string;
  startRule:
    | "DEALER_PURCHASE"
    | "DEALER_REGISTRATION"
    | "CUSTOMER_SALE";
  registrationRequired: boolean;
  registrationDeadlineMonths: string;
  claimLimit: string;
  replacementLimit: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const emptyForm: FormData = {
  code: "",
  name: "",
  warrantyMonths: "12",
  startRule: "DEALER_PURCHASE",
  registrationRequired: false,
  registrationDeadlineMonths: "",
  claimLimit: "",
  replacementLimit: "",
};

export default function WarrantyPoliciesPage() {
  const [policies, setPolicies] = useState<WarrantyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] =
    useState<WarrantyPolicy | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);

  async function loadPolicies() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/warranty-policies`,
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load warranty policies.",
        );
      }

      const data = await response.json();

      setPolicies(data);
    } catch (error) {
      console.error(error);

      setError("Unable to load warranty policies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPolicies();
  }, []);

  function formatStartRule(
    rule: WarrantyPolicy["startRule"],
  ) {
    switch (rule) {
      case "DEALER_PURCHASE":
        return "Dealer Purchase";

      case "DEALER_REGISTRATION":
        return "Dealer Registration";

      case "CUSTOMER_SALE":
        return "Customer Sale";

      default:
        return rule;
    }
  }

  function formatLimit(value?: number | null) {
    return value == null
      ? "Unlimited"
      : `${value} time${value === 1 ? "" : "s"}`;
  }

  function openCreateForm() {
    setEditingPolicy(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEditForm(policy: WarrantyPolicy) {
    setEditingPolicy(policy);

    setForm({
      code: policy.code,
      name: policy.name,
      warrantyMonths: String(
        policy.warrantyMonths,
      ),
      startRule: policy.startRule,
      registrationRequired:
        policy.registrationRequired,
      registrationDeadlineMonths:
        policy.registrationDeadlineMonths != null
          ? String(
              policy.registrationDeadlineMonths,
            )
          : "",
      claimLimit:
        policy.claimLimit != null
          ? String(policy.claimLimit)
          : "",
      replacementLimit:
        policy.replacementLimit != null
          ? String(policy.replacementLimit)
          : "",
    });

    setShowForm(true);
    setError("");
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingPolicy(null);
    setForm(emptyForm);
  }

  function updateForm(
    field: keyof FormData,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    if (!form.code.trim()) {
      setError("Policy code is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Policy name is required.");
      return;
    }

    if (!form.warrantyMonths) {
      setError("Warranty period is required.");
      return;
    }

    if (
      form.registrationRequired &&
      !form.registrationDeadlineMonths
    ) {
      setError(
        "Registration deadline is required when registration is enabled.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        warrantyMonths: Number(
          form.warrantyMonths,
        ),
        startRule: form.startRule,
        registrationRequired:
          form.registrationRequired,
        registrationDeadlineMonths:
          form.registrationRequired &&
          form.registrationDeadlineMonths
            ? Number(
                form.registrationDeadlineMonths,
              )
            : null,
        claimLimit: form.claimLimit
          ? Number(form.claimLimit)
          : null,
        replacementLimit:
          form.replacementLimit
            ? Number(form.replacementLimit)
            : null,
      };

      const url = editingPolicy
        ? `${API_BASE_URL}/warranty-policies/${editingPolicy.id}`
        : `${API_BASE_URL}/warranty-policies`;

      const response = await fetch(url, {
        method: editingPolicy
          ? "PATCH"
          : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            `Unable to ${
              editingPolicy
                ? "update"
                : "create"
            } warranty policy.`,
        );
      }

      closeForm();

      await loadPolicies();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save warranty policy.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePolicy(
    policy: WarrantyPolicy,
  ) {
    try {
      setError("");

      const action = policy.isActive
        ? "disable"
        : "enable";

      const response = await fetch(
        `${API_BASE_URL}/warranty-policies/${policy.id}/${action}`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            `Unable to ${action} warranty policy.`,
        );
      }

      await loadPolicies();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update policy status.",
      );
    }
  }

    return (
    <PermissionGuard permission="WARRANTY_POLICY_VIEW">
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
              Warranty Policies
            </h1>

            <p className="mt-2 text-slate-500">
              Manage internal warranty rules and policies.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            + Add Warranty Policy
          </button>

        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Form */}

        {showForm && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">

            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingPolicy
                    ? "Edit Warranty Policy"
                    : "Add Warranty Policy"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage internal warranty rules.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="text-2xl font-bold text-slate-400 hover:text-slate-700"
              >
                ×
              </button>

            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">

              {/* Code */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Policy Code
                </label>

                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    updateForm(
                      "code",
                      e.target.value.toUpperCase(),
                    )
                  }
                  placeholder="Example: B"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 uppercase outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Name */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Policy Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    updateForm(
                      "name",
                      e.target.value,
                    )
                  }
                  placeholder="Example: One Year Replacement"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Warranty Period */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Warranty Period (Months)
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.warrantyMonths}
                  onChange={(e) =>
                    updateForm(
                      "warrantyMonths",
                      e.target.value,
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Start Rule */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Warranty Start Rule
                </label>

                <select
                  value={form.startRule}
                  onChange={(e) =>
                    updateForm(
                      "startRule",
                      e.target.value as FormData["startRule"],
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="DEALER_PURCHASE">
                    Dealer Purchase
                  </option>

                  <option value="DEALER_REGISTRATION">
                    Dealer Registration
                  </option>

                  <option value="CUSTOMER_SALE">
                    Customer Sale
                  </option>
                </select>
              </div>

              {/* Registration */}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={
                      form.registrationRequired
                    }
                    onChange={(e) =>
                      updateForm(
                        "registrationRequired",
                        e.target.checked,
                      )
                    }
                    className="h-5 w-5 accent-emerald-600"
                  />

                  <span className="font-semibold text-slate-800">
                    Dealer registration required
                  </span>

                </label>

                {form.registrationRequired && (
                  <div className="mt-4 max-w-md">

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Registration Deadline (Months)
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        form.registrationDeadlineMonths
                      }
                      onChange={(e) =>
                        updateForm(
                          "registrationDeadlineMonths",
                          e.target.value,
                        )
                      }
                      placeholder="Example: 12"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />

                  </div>
                )}

              </div>

              {/* Claim Limit */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Claim Limit
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.claimLimit}
                  onChange={(e) =>
                    updateForm(
                      "claimLimit",
                      e.target.value,
                    )
                  }
                  placeholder="Leave empty = Unlimited"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Empty means unlimited.
                </p>
              </div>

              {/* Replacement Limit */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Replacement Limit
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.replacementLimit}
                  onChange={(e) =>
                    updateForm(
                      "replacementLimit",
                      e.target.value,
                    )
                  }
                  placeholder="Leave empty = Unlimited"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Empty means unlimited.
                </p>
              </div>

            </div>

            {/* Actions */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {saving
                  ? "Saving..."
                  : editingPolicy
                    ? "Save Changes"
                    : "Create Policy"}
              </button>

            </div>

          </div>
        )}

        {/* Policies */}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-slate-500">
              Loading warranty policies...
            </p>
          </div>
        ) : policies.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-slate-500">
              No warranty policies found.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">

            {policies.map((policy) => (
              <div
                key={policy.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                policy.isActive
                ? "border-slate-200"
                : "border-red-200"
                }`}
              >

                {/* Header */}

                <div className="flex items-start justify-between border-b border-slate-200 p-6">

                  <div>
                    <div className="flex items-center gap-3">

                      <span className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-extrabold text-emerald-700">
                        {policy.code}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          policy.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {policy.isActive
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </span>

                    </div>

                    <h2
                        className={`mt-3 text-xl font-bold ${
                        policy.isActive
                        ? "text-slate-900"
                        : "text-red-600"
                        }`}
                        >
                     {policy.name}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(policy)
                    }
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Edit
                  </button>

                </div>

                {/* Details */}

                <div className="grid gap-4 p-6 sm:grid-cols-2">

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Warranty Period
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {policy.warrantyMonths} Months
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Start Rule
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {formatStartRule(
                        policy.startRule,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Registration
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {policy.registrationRequired
                        ? `Required${
                            policy.registrationDeadlineMonths
                              ? ` within ${policy.registrationDeadlineMonths} months`
                              : ""
                          }`
                        : "Not Required"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Claim Limit
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {formatLimit(
                        policy.claimLimit,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Replacement Limit
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {formatLimit(
                        policy.replacementLimit,
                      )}
                    </p>
                  </div>

                </div>

                {/* Status Action */}

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">

                  <p className="text-sm text-slate-500">
                    Policy status
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      togglePolicy(policy)
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                      policy.isActive
                        ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {policy.isActive
                      ? "Disable"
                      : "Enable"}
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
        </main>
    </PermissionGuard>
  );
}