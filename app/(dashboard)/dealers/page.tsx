'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:5001';

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
  status: 'ACTIVE' | 'INACTIVE';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
};

type DealerDetails = Dealer & {
  loginUsername?: string | null;
  loginStatus?: 'ACTIVE' | 'INACTIVE' | null;
};

type DealerForm = {
  username: string;
  password: string;
  companyName: string;
  ownerName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  township: string;
  stateRegion: string;
  remarks: string;
};

const initialForm: DealerForm = {
  username: '',
  password: '',
  companyName: '',
  ownerName: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  township: '',
  stateRegion: '',
  remarks: '',
};

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [form, setForm] =
    useState<DealerForm>(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showCreate, setShowCreate] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showEdit, setShowEdit] =
    useState(false);

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [selectedDealer, setSelectedDealer] =
    useState<DealerDetails | null>(null);

  const [newPassword, setNewPassword] =
    useState('');

  const [actionLoading, setActionLoading] =
    useState(false);

  async function loadDealers() {
    try {
      setLoading(true);
      setError('');

      const token =
        localStorage.getItem('accessToken');

      if (!token) {
        throw new Error(
          'Login session not found. Please login again.',
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/dealers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to load dealers (${response.status})`,
        );
      }

      setDealers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load dealers',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDealers();
  }, []);

  function updateField(
    field: keyof DealerForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreate(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token =
        localStorage.getItem('accessToken');

      if (!token) {
        throw new Error(
          'Login session not found. Please login again.',
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/dealers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
            dealerCode: '',
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to create dealer (${response.status})`,
        );
      }

      setSuccess(
        `Dealer ${data.dealerCode} created successfully.`,
      );

      setForm(initialForm);
      setShowCreate(false);

      await loadDealers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create dealer',
      );
    } finally {
      setSaving(false);
    }
  }

  async function openDetails(
    dealer: Dealer,
  ) {
    try {
      setActionLoading(true);
      setError('');

      const token =
        localStorage.getItem('accessToken');

      if (!token) {
        throw new Error(
          'Login session not found.',
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/dealers/${dealer.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Unable to load dealer details.',
        );
      }

      setSelectedDealer(data);
      setShowDetails(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load dealer details.',
      );
    } finally {
      setActionLoading(false);
    }
  }

  function openEdit(
    dealer: DealerDetails,
  ) {
    setSelectedDealer(dealer);

    setForm({
      username:
        dealer.loginUsername ?? '',
      password: '',
      companyName:
        dealer.companyName ?? '',
      ownerName:
        dealer.ownerName ?? '',
      contactPerson:
        dealer.contactPerson ?? '',
      phone:
        dealer.phone ?? '',
      email:
        dealer.email ?? '',
      address:
        dealer.address ?? '',
      township:
        dealer.township ?? '',
      stateRegion:
        dealer.stateRegion ?? '',
      remarks:
        dealer.remarks ?? '',
    });

    setShowEdit(true);
  }

  async function handleUpdate(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!selectedDealer) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const token =
        localStorage.getItem('accessToken');

      if (!token) {
        throw new Error(
          'Login session not found.',
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/dealers/${selectedDealer.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: form.username,
            companyName: form.companyName,
            ownerName: form.ownerName,
            contactPerson: form.contactPerson,
            phone: form.phone,
            email: form.email,
            address: form.address,
            township: form.township,
            stateRegion: form.stateRegion,
            remarks: form.remarks,
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Unable to update dealer.',
        );
      }

      setSuccess(
        'Dealer information updated successfully.',
      );

      setShowEdit(false);
      setSelectedDealer(null);
      setForm(initialForm);

      await loadDealers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update dealer.',
      );
    } finally {
      setActionLoading(false);
    }
  }

  function openPasswordModal(
    dealer: DealerDetails,
  ) {
    setSelectedDealer(dealer);
    setNewPassword('');
    setShowPasswordModal(true);
  }

  async function handlePasswordChange(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!selectedDealer) {
      return;
    }

    if (newPassword.trim().length < 6) {
      setError(
        'Password must be at least 6 characters.',
      );
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const token =
        localStorage.getItem('accessToken');

      if (!token) {
        throw new Error(
          'Login session not found.',
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/dealers/${selectedDealer.id}/password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: newPassword,
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Unable to change dealer password.',
        );
      }

      setSuccess(
        'Dealer password changed successfully.',
      );

      setNewPassword('');
      setShowPasswordModal(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to change dealer password.',
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleStatus(
    dealer: Dealer,
  ) {
    const nextStatus =
      dealer.status === 'ACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE';

    const confirmed = window.confirm(
      `${nextStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} ${dealer.companyName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const token =
        localStorage.getItem('accessToken');

      if (!token) {
        throw new Error(
          'Login session not found.',
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/dealers/${dealer.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Unable to update dealer status.',
        );
      }

      setSuccess(
        `Dealer ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`,
      );

      await loadDealers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update dealer status.',
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Dealer Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage Dealer information, login accounts,
              passwords and account status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(initialForm);
              setError('');
              setSuccess('');
              setShowCreate(true);
            }}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Create Dealer
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Dealer Accounts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {dealers.length} dealer account
              {dealers.length === 1 ? '' : 's'}
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">
              Loading dealers...
            </div>
          ) : dealers.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No dealer accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">
                      Dealer Code
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Company
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Contact
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Phone
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Township
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {dealers.map((dealer) => (
                    <tr
                      key={dealer.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {dealer.dealerCode}
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {dealer.companyName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {dealer.ownerName}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {dealer.contactPerson || '—'}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {dealer.phone}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {dealer.township}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            dealer.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {dealer.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openDetails(dealer)
                            }
                            disabled={actionLoading}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const token =
                                  localStorage.getItem(
                                    'accessToken',
                                  );

                                if (!token) {
                                  throw new Error(
                                    'Login session not found.',
                                  );
                                }

                                const response =
                                  await fetch(
                                    `${API_BASE_URL}/dealers/${dealer.id}`,
                                    {
                                      headers: {
                                        Authorization:
                                          `Bearer ${token}`,
                                      },
                                    },
                                  );

                                const data =
                                  await response.json();

                                if (!response.ok) {
                                  throw new Error(
                                    data?.message ||
                                      'Unable to load dealer.',
                                  );
                                }

                                openEdit(data);
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : 'Unable to load dealer.',
                                );
                              }
                            }}
                            disabled={actionLoading}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openPasswordModal(dealer)
                            }
                            disabled={actionLoading}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                          >
                            Password
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(dealer)
                            }
                            disabled={actionLoading}
                            className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                              dealer.status === 'ACTIVE'
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {dealer.status === 'ACTIVE'
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          CREATE DEALER MODAL
      ===================================================== */}

      {showCreate && (
        <Modal
          title="Create Dealer Account"
          subtitle="Create Dealer information and Dealer Portal login account."
          onClose={() => {
            if (!saving) {
              setShowCreate(false);
            }
          }}
        >
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <Input
              label="Dealer Username"
              value={form.username}
              onChange={(value) =>
                updateField('username', value)
              }
              required
            />

            <PasswordInput
              label="Dealer Password"
              value={form.password}
              onChange={(value) =>
                updateField('password', value)
              }
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              required
            />

            <div className="md:col-span-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Dealer Code
                </p>

                <p className="mt-1 text-sm font-semibold text-emerald-800">
                  Automatically generated by system
                </p>
              </div>
            </div>

            <Input
              label="Company Name"
              value={form.companyName}
              onChange={(value) =>
                updateField('companyName', value)
              }
              required
            />

            <Input
              label="Owner Name"
              value={form.ownerName}
              onChange={(value) =>
                updateField('ownerName', value)
              }
              required
            />

            <Input
              label="Contact Person"
              value={form.contactPerson}
              onChange={(value) =>
                updateField('contactPerson', value)
              }
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(value) =>
                updateField('phone', value)
              }
              required
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) =>
                updateField('email', value)
              }
            />

            <Input
              label="Township"
              value={form.township}
              onChange={(value) =>
                updateField('township', value)
              }
              required
            />

            <Input
              label="State / Region"
              value={form.stateRegion}
              onChange={(value) =>
                updateField('stateRegion', value)
              }
              required
            />

            <div className="md:col-span-2">
              <Input
                label="Address"
                value={form.address}
                onChange={(value) =>
                  updateField('address', value)
                }
                required
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Remarks"
                value={form.remarks}
                onChange={(value) =>
                  updateField('remarks', value)
                }
              />
            </div>

            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving
                  ? 'Creating...'
                  : 'Create Dealer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =====================================================
          VIEW DETAILS MODAL
      ===================================================== */}

      {showDetails && selectedDealer && (
        <Modal
          title="Dealer Details"
          subtitle="Complete Dealer information and login account."
          onClose={() =>
            setShowDetails(false)
          }
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Dealer Code
                </p>

                <p className="mt-1 text-xl font-extrabold text-slate-900">
                  {selectedDealer.dealerCode}
                </p>
              </div>

              <StatusBadge
                status={selectedDealer.status}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Info
                label="Company Name"
                value={
                  selectedDealer.companyName
                }
              />

              <Info
                label="Owner Name"
                value={
                  selectedDealer.ownerName
                }
              />

              <Info
                label="Contact Person"
                value={
                  selectedDealer.contactPerson
                }
              />

              <Info
                label="Phone"
                value={
                  selectedDealer.phone
                }
              />

              <Info
                label="Email"
                value={
                  selectedDealer.email
                }
              />

              <Info
                label="Township"
                value={
                  selectedDealer.township
                }
              />

              <Info
                label="State / Region"
                value={
                  selectedDealer.stateRegion
                }
              />

              <Info
                label="Dealer ID"
                value={
                  selectedDealer.id
                }
              />

              <div className="md:col-span-2">
                <Info
                  label="Address"
                  value={
                    selectedDealer.address
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Info
                  label="Remarks"
                  value={
                    selectedDealer.remarks
                  }
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-sm font-extrabold text-slate-800">
                Dealer Login Account
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Info
                  label="Username"
                  value={
                    selectedDealer.loginUsername
                  }
                />

                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Login Status
                  </p>

                  <StatusBadge
                    status={
                      selectedDealer.loginStatus ??
                      selectedDealer.status
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  openEdit(selectedDealer);
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowDetails(false)
                }
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =====================================================
          EDIT DEALER MODAL
      ===================================================== */}

      {showEdit && selectedDealer && (
        <Modal
          title="Edit Dealer"
          subtitle={`Update ${selectedDealer.dealerCode} information.`}
          onClose={() => {
            if (!actionLoading) {
              setShowEdit(false);
            }
          }}
        >
          <form
            onSubmit={handleUpdate}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Dealer Code
                </p>

                <p className="mt-1 font-extrabold text-slate-900">
                  {selectedDealer.dealerCode}
                </p>
              </div>
            </div>

            <Input
              label="Dealer Username"
              value={form.username}
              onChange={(value) =>
                updateField('username', value)
              }
              required
            />

            <Input
              label="Company Name"
              value={form.companyName}
              onChange={(value) =>
                updateField('companyName', value)
              }
              required
            />

            <Input
              label="Owner Name"
              value={form.ownerName}
              onChange={(value) =>
                updateField('ownerName', value)
              }
              required
            />

            <Input
              label="Contact Person"
              value={form.contactPerson}
              onChange={(value) =>
                updateField('contactPerson', value)
              }
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(value) =>
                updateField('phone', value)
              }
              required
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) =>
                updateField('email', value)
              }
            />

            <Input
              label="Township"
              value={form.township}
              onChange={(value) =>
                updateField('township', value)
              }
              required
            />

            <Input
              label="State / Region"
              value={form.stateRegion}
              onChange={(value) =>
                updateField('stateRegion', value)
              }
              required
            />

            <div className="md:col-span-2">
              <Input
                label="Address"
                value={form.address}
                onChange={(value) =>
                  updateField('address', value)
                }
                required
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Remarks"
                value={form.remarks}
                onChange={(value) =>
                  updateField('remarks', value)
                }
              />
            </div>

            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() =>
                  setShowEdit(false)
                }
                disabled={actionLoading}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={actionLoading}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {actionLoading
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =====================================================
          PASSWORD MODAL
      ===================================================== */}

      {showPasswordModal && selectedDealer && (
        <Modal
          title="Change Dealer Password"
          subtitle={`Set a new password for ${selectedDealer.dealerCode}.`}
          onClose={() => {
            if (!actionLoading) {
              setShowPasswordModal(false);
            }
          }}
        >
          <form
            onSubmit={handlePasswordChange}
            className="space-y-5"
          >
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Dealer Login
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {selectedDealer.loginUsername}
              </p>
            </div>

            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              required
            />

            <p className="text-xs text-slate-400">
              Password must be at least 6 characters.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowPasswordModal(false)
                }
                disabled={actionLoading}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={actionLoading}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {actionLoading
                  ? 'Updating...'
                  : 'Change Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

/* =========================================================
   PASSWORD INPUT
========================================================= */

function PasswordInput({
  label,
  value,
  onChange,
  showPassword,
  setShowPassword,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <div className="relative">
        <input
          type={
            showPassword
              ? 'text'
              : 'password'
          }
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          required={required}
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(
              (current) => !current,
            )
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </label>
  );
}

/* =========================================================
   INFO
========================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="break-words text-sm font-semibold text-slate-800">
        {value || '—'}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: 'ACTIVE' | 'INACTIVE' | string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        status === 'ACTIVE'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {status}
    </span>
  );
}