"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Edit,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "WAREHOUSE"
  | "SERVICE"
  | "DEALER";

type User = {
  id: string;
  username: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type UserGroup = "OFFICE" | "DEALER";

const OFFICE_ROLES: UserRole[] = [
  "ADMIN",
  "MANAGER",
  "WAREHOUSE",
  "SERVICE",
];

export default function UsersPage() {


  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

const [showCreate, setShowCreate] = useState(false);
const [saving, setSaving] = useState(false);
const [editingUser, setEditingUser] = useState<User | null>(null);

  const [userGroup, setUserGroup] =
    useState<UserGroup>("OFFICE");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [role, setRole] =
    useState<UserRole>("MANAGER");

    const [showPermissions, setShowPermissions] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [permissions, setPermissions] = useState<
    {
      id: string;
      code: string;
      name: string;
      isActive: boolean;
    }[]
  >([]);

  const [selectedPermissionIds, setSelectedPermissionIds] =
    useState<string[]>([]);

  const [permissionsLoading, setPermissionsLoading] =
    useState(false);

  const [permissionsSaving, setPermissionsSaving] =
    useState(false);  

  async function loadUsers() {
    try {
      setLoading(true);
      setErrorMessage("");

      const token =
        localStorage.getItem("accessToken");

      if (!token) {
        throw new Error(
          "Login session not found.",
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/users`,
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
            "Unable to load users.",
        );
      }

      setUsers(data);
    } catch (error) {
      console.error(
        "Users Load Error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }

    useEffect(() => {
  loadUsers();
}, []);

  function openCreateUser() {
    setErrorMessage("");
    setUserGroup("OFFICE");
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setRole("MANAGER");
    setShowCreate(true);
  }

  function handleGroupChange(
    group: UserGroup,
  ) {
    setUserGroup(group);

    if (group === "DEALER") {
      setRole("DEALER");
    } else {
      setRole("MANAGER");
    }
  }


async function handleStatusChange(
  userId: string,
  status: "ACTIVE" | "INACTIVE",
) {
  try {
    setSaving(true);
    setErrorMessage("");

    const token =
      localStorage.getItem("accessToken");

    if (!token) {
      throw new Error(
        "Login session not found.",
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
        }),
      },
    );

    const data =
      await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to update user status.",
      );
    }

    await loadUsers();
  } catch (error) {
    console.error(
      "Update User Status Error:",
      error,
    );

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Unable to update user status.",
    );
  } finally {
    setSaving(false);
  }
}

  async function handleCreateUser(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  if (!username.trim()) {
    return;
  }

  if (!editingUser && !password.trim()) {
    return;
  }

  try {
    setSaving(true);
    setErrorMessage("");

    const token =
      localStorage.getItem("accessToken");

    if (!token) {
      throw new Error(
        "Login session not found.",
      );
    }

    const selectedRole =
      userGroup === "DEALER"
        ? "DEALER"
        : role;

    let response: Response;

    if (editingUser) {
      const updateData: {
        username: string;
        role: UserRole;
        password?: string;
      } = {
        username: username.trim(),
        role: selectedRole,
      };

      if (password.trim()) {
        updateData.password =
          password.trim();
      }

      response = await fetch(
        `${API_BASE_URL}/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        },
      );
    } else {
      response = await fetch(
        `${API_BASE_URL}/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            role: selectedRole,
          }),
        },
      );
    }

    const data =
      await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          (editingUser
            ? "Unable to update user."
            : "Unable to create user."),
      );
    }

    setUsername("");
    setPassword("");
    setShowPassword(false);
    setUserGroup("OFFICE");
    setRole("MANAGER");
    setEditingUser(null);
    setShowCreate(false);

    await loadUsers();
  } catch (error) {
    console.error(
      "User Save Error:",
      error,
    );

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Unable to save user.",
    );
  } finally {
    setSaving(false);
  }
}

  function getRoleLabel(
    userRole: UserRole,
  ) {
    switch (userRole) {
      case "ADMIN":
        return "Super Admin";
      case "MANAGER":
        return "Manager";
      case "WAREHOUSE":
        return "Warehouse";
      case "SERVICE":
        return "Service";
      case "DEALER":
        return "Dealer";
      default:
        return userRole;
    }
  }

  function getRoleClass(
    userRole: UserRole,
  ) {
    switch (userRole) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700";
      case "MANAGER":
        return "bg-blue-100 text-blue-700";
      case "WAREHOUSE":
        return "bg-amber-100 text-amber-700";
      case "SERVICE":
        return "bg-cyan-100 text-cyan-700";
      case "DEALER":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }
function openEditUser(user: User) {
  setErrorMessage("");
  setEditingUser(user);

  setUsername(user.username);
  setPassword("");
  setShowPassword(false);

  if (user.role === "DEALER") {
    setUserGroup("DEALER");
    setRole("DEALER");
  } else {
    setUserGroup("OFFICE");
    setRole(user.role);
  }

  setShowCreate(true);
}

    async function openPermissions(
    user: User,
  ) {
    try {
      setPermissionsLoading(true);
      setErrorMessage("");
      setSelectedUser(user);
      setShowPermissions(true);

      const token =
        localStorage.getItem("accessToken");

      if (!token) {
        throw new Error(
          "Login session not found.",
        );
      }

      const permissionsResponse =
        await fetch(
          `${API_BASE_URL}/permissions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

      const permissionsData =
        await permissionsResponse
          .json()
          .catch(() => null);

      if (!permissionsResponse.ok) {
        throw new Error(
          permissionsData?.message ||
            "Unable to load permissions.",
        );
      }

      setPermissions(permissionsData);

      const userPermissionsResponse =
        await fetch(
          `${API_BASE_URL}/users/${user.id}/permissions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

      const userPermissionsData =
        await userPermissionsResponse
          .json()
          .catch(() => null);

      if (!userPermissionsResponse.ok) {
        throw new Error(
          userPermissionsData?.message ||
            "Unable to load user permissions.",
        );
      }

      setSelectedPermissionIds(
        userPermissionsData.map(
          (item: {
            permission: {
              id: string;
            };
          }) => item.permission.id,
        ),
      );
    } catch (error) {
      console.error(
        "Permissions Load Error:",
        error,
      );

      setShowPermissions(false);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load permissions.",
      );
    } finally {
      setPermissionsLoading(false);
    }
  }

  async function savePermissions() {
    if (!selectedUser) {
      return;
    }

    try {
      setPermissionsSaving(true);
      setErrorMessage("");

      const token =
        localStorage.getItem("accessToken");

      if (!token) {
        throw new Error(
          "Login session not found.",
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/users/${selectedUser.id}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            permissionIds:
              selectedPermissionIds,
          }),
        },
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to save permissions.",
        );
      }

      setShowPermissions(false);
      setSelectedUser(null);
      setSelectedPermissionIds([]);

      await loadUsers();
    } catch (error) {
      console.error(
        "Permissions Save Error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save permissions.",
      );
    } finally {
      setPermissionsSaving(false);
    }
  }

  function formatDate(
    date: string | null,
  ) {
    if (!date) {
      return "Never";
    }

    return new Date(date).toLocaleString();
  }

  const officeCount = users.filter(
    (user) => user.role !== "DEALER",
  ).length;

  const dealerCount = users.filter(
    (user) => user.role === "DEALER",
  ).length;

  return (
  <DashboardShell>
    <div className="space-y-6">
      <PageTitle
        title="User Management"
        subtitle="Manage Office and Dealer accounts."
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
                <Users size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-slate-800">
                  User Management
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage Office and Dealer accounts.
                </p>
              </div>
            </div>
          </div>

         <button
  type="button"
  className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
>
  <Edit size={15} />
  Edit
</button>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Office Users
            </p>

            <p className="mt-2 text-2xl font-extrabold text-slate-800">
              {officeCount}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Dealer Accounts
            </p>

            <p className="mt-2 text-2xl font-extrabold text-emerald-700">
              {dealerCount}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <UserCog
                size={19}
                className="text-emerald-600"
              />

              <h2 className="font-bold text-slate-800">
                System Users
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Office users and Dealer accounts are
              managed separately.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-emerald-600"
                />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading users...
                </p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
              <Users
                size={40}
                className="text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-600">
                No users found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      User
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Group
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Role
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Last Login
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const isDealer =
                      user.role === "DEALER";

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                              <UserCog size={19} />
                            </div>

                            <div>
                              <p className="font-bold text-slate-800">
                                {user.username}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              isDealer
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {isDealer
                              ? "Dealer"
                              : "Office"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getRoleClass(
                              user.role,
                            )}`}
                          >
                            {getRoleLabel(
                              user.role,
                            )}
                          </span>
                        </td>

                       <td className="px-5 py-4">
  <button
    type="button"
    onClick={() =>
      handleStatusChange(
        user.id,
        user.status === "ACTIVE"
          ? "INACTIVE"
          : "ACTIVE",
      )
    }
    disabled={saving}
    title={
      user.status === "ACTIVE"
        ? "Click to deactivate"
        : "Click to activate"
    }
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold transition ${
      user.status === "ACTIVE"
        ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700"
        : "bg-red-100 text-red-700 hover:bg-emerald-100 hover:text-emerald-700"
    }`}
  >
    <span
      className={`h-2 w-2 rounded-full ${
        user.status === "ACTIVE"
          ? "bg-emerald-500"
          : "bg-red-500"
      }`}
    />

    {user.status}
  </button>
</td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(
                            user.lastLoginAt,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
  type="button"
  onClick={() => openEditUser(user)}
  className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
>
  <Edit size={15} />
  Edit
</button>

                            <button
  type="button"
  onClick={() => openPermissions(user)}
  disabled={saving}
  className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
>
  <KeyRound size={15} />
  Permissions
</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <p className="text-sm font-bold text-emerald-800">
              Access Control
            </p>

            <p className="mt-1 text-xs leading-5 text-emerald-700">
              Office accounts and Dealer accounts
              use separate access boundaries.
              Dealer access is limited to authorized
              Dealer functions.
            </p>
          </div>
        </div>
      </div>

{showPermissions && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
    <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            User Permissions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedUser?.username}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowPermissions(false);
            setSelectedUser(null);
            setSelectedPermissionIds([]);
          }}
          disabled={permissionsSaving}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-xl font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ×
        </button>
      </div>

      {permissionsLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <div className="text-center">
            <Loader2
              size={30}
              className="mx-auto animate-spin text-emerald-600"
            />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading permissions...
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-6">
            {permissions.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="font-semibold text-slate-600">
                  No permissions found.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {permissions.map((permission) => {
                  const checked =
                    selectedPermissionIds.includes(
                      permission.id,
                    );

                  return (
                    <label
                      key={permission.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        checked
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedPermissionIds(
                            (current) =>
                              checked
                                ? current.filter(
                                    (id) =>
                                      id !==
                                      permission.id,
                                  )
                                : [
                                    ...current,
                                    permission.id,
                                  ],
                          );
                        }}
                        disabled={permissionsSaving}
                        className="mt-1 h-4 w-4 accent-emerald-600"
                      />

                      <div className="min-w-0">
                        <p className="font-bold text-slate-800">
                          {permission.name}
                        </p>

                        <p className="mt-1 text-xs font-medium text-emerald-600">
                          {permission.code}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-xs font-semibold text-slate-500">
              {selectedPermissionIds.length} permission(s) selected
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPermissions(false);
                  setSelectedUser(null);
                  setSelectedPermissionIds([]);
                }}
                disabled={permissionsSaving}
                className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-600 transition hover:bg-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={savePermissions}
                disabled={
                  permissionsSaving ||
                  permissionsLoading ||
                  !selectedUser
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {permissionsSaving && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}

                {permissionsSaving
                  ? "Saving..."
                  : "Save Permissions"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
)}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-extrabold text-slate-800">
  {editingUser ? "Edit User" : "Create User"}
</h2>

<p className="mt-1 text-sm text-slate-500">
  {editingUser
    ? "Update the user account details."
    : "Create an Office or Dealer account."}
</p>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Account Group
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleGroupChange(
                        "OFFICE",
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      userGroup === "OFFICE"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold text-slate-800">
                      Office
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Internal staff account
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleGroupChange(
                        "DEALER",
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      userGroup === "DEALER"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold text-slate-800">
                      Dealer
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Dealer portal account
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value,
                    )
                  }
                  placeholder="Enter username"
                  disabled={saving}
                  autoComplete="off"
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Enter password"
                    disabled={saving}
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-slate-300 px-4 pr-12 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    disabled={saving}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>

                <p className="mt-1.5 text-xs text-slate-400">
                  Click the eye icon to show or hide
                  the password.
                </p>
              </div>

             {userGroup === "OFFICE" && (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      Office Role
    </label>

    <select
      value={role}
      onChange={(event) =>
        setRole(
          event.target.value as UserRole,
        )
      }
      disabled={saving}
      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    >
      <option value="MANAGER">Manager</option>
      <option value="SALES">Sales</option>
      <option value="MARKETING">Marketing</option>
      <option value="WAREHOUSE">Warehouse</option>
      <option value="SERVICE">Service</option>
    </select>
  </div>
)}

              {userGroup === "DEALER" && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-emerald-800">
                    Dealer Account
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                    This account will use the
                    separate Dealer portal.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                  disabled={saving}
                  className="h-11 flex-1 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
  saving ||
  !username.trim() ||
  (!editingUser && !password.trim())
}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
  ? editingUser
    ? "Saving..."
    : "Creating..."
  : editingUser
    ? "Save Changes"
    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}