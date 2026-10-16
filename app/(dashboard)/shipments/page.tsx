"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import DashboardShell from "@/components/layout/DashboardShell";
import PageTitle from "@/components/common/PageTitle";
import { Printer } from "lucide-react";

import {
  createShipmentWithSerials,
  confirmDraftShipment,
  deleteShipment,
  getShipments,
  getSerialByNumber,
  getSuntreeServiceIssues,
  createSuntreeServiceIssue,
  completeSuntreeServiceIssue,
  type Shipment,
  type SuntreeServiceIssue,
} from "@/lib/api";
import { printThermalReceipt } from "@/lib/thermalReceipt";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5001"
).replace(/\/+$/, "");

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
  const [serviceIssues, setServiceIssues] =
    useState<SuntreeServiceIssue[]>([]);
  const [listMode, setListMode] = useState<"SALES" | "SERVICE">("SALES");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [issueNo, setIssueNo] = useState("");
  const [serviceDepartment, setServiceDepartment] = useState("");
  const [projectName, setProjectName] = useState("");
  const [servicePerson, setServicePerson] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceRemarks, setServiceRemarks] = useState("");
  const [serviceScan, setServiceScan] = useState("");
  const [serviceSerials, setServiceSerials] = useState<string[]>([]);
  const [returnIssueId, setReturnIssueId] = useState("");
  const [returnScan, setReturnScan] = useState("");
  const [returnedSerials, setReturnedSerials] = useState<string[]>([]);

  const [dealers, setDealers] =
    useState<Dealer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState("");

  const [confirming, setConfirming] =
    useState("");

  const [canConfirmShipments, setCanConfirmShipments] =
    useState(false);

  const [isAdmin, setIsAdmin] =
    useState(false);

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

  const [scanSerial, setScanSerial] =
    useState("");

  const [serialNumbers, setSerialNumbers] =
    useState<string[]>([]);

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

      try {
        const authUser = JSON.parse(
          localStorage.getItem("authUser") ?? "null",
        );
        setIsAdmin(authUser?.role === "ADMIN");
        setCanConfirmShipments(
          ["ADMIN", "MANAGER", "WAREHOUSE"].includes(authUser?.role),
        );
      } catch {
        setIsAdmin(false);
        setCanConfirmShipments(false);
      }

      if (!token) {
        throw new Error(
          "Login session not found. Please login again.",
        );
      }

      const [
        shipmentResponse,
        serviceIssueResponse,
        dealerResponse,
      ] = await Promise.all([
        getShipments(),
        getSuntreeServiceIssues(),

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
      setServiceIssues(serviceIssueResponse);

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
    setScanSerial("");
    setSerialNumbers([]);
  }

  function resetServiceForm() {
    setIssueNo(`SVC-${Date.now()}`);
    setServiceDepartment("");
    setProjectName("");
    setServicePerson("");
    setServiceDate(getTodayDate());
    setServiceRemarks("");
    setServiceScan("");
    setServiceSerials([]);
  }

  async function addServiceSerial() {
    const serialNumber = serviceScan.replace(/\D/g, "");
    if (!serialNumber) return;
    if (!/^\d{9}$/.test(serialNumber)) {
      setError("Serial barcode must contain exactly 9 digits.");
      setServiceScan("");
      return;
    }
    if (serviceSerials.includes(serialNumber)) {
      setError(`Serial ${serialNumber} is already in this service issue.`);
      setServiceScan("");
      return;
    }
    try {
      const serial = await getSerialByNumber(serialNumber);
      if (serial.status !== "IN_STOCK" || !(serial.productId || serial.product?.id)) {
        throw new Error(`Only product-assigned IN_STOCK serials can be issued. Current status: ${serial.status}.`);
      }
      setServiceSerials((current) => [...current, serialNumber]);
      setServiceScan("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : `Serial ${serialNumber} could not be added.`);
      setServiceScan("");
    }
  }

  async function handleServiceIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceSerials.length) {
      setError("Scan at least one serial for this service issue.");
      return;
    }
    try {
      setServiceSaving(true);
      setError("");
      await createSuntreeServiceIssue({
        issueNo: issueNo.trim(),
        serviceDepartment: serviceDepartment.trim(),
        projectName: projectName.trim(),
        servicePerson: servicePerson.trim(),
        issuedDate: serviceDate,
        remarks: serviceRemarks.trim() || undefined,
        serialNumbers: serviceSerials,
      });
      setSuccess(`Service issue ${issueNo} created with ${serviceSerials.length} serial(s).`);
      setShowServiceForm(false);
      resetServiceForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create service issue.");
    } finally {
      setServiceSaving(false);
    }
  }

  async function addReturnedSerial() {
    const serialNumber = returnScan.replace(/\D/g, "");
    if (!serialNumber || !returnIssueId) return;
    const issue = serviceIssues.find((item) => item.id === returnIssueId);
    const eligible = issue?.items.some((item) => item.serial.serialNumber === serialNumber && item.disposition === "ISSUED");
    if (!eligible) {
      setError(`Serial ${serialNumber} is not an outstanding serial in this service issue.`);
      setReturnScan("");
      return;
    }
    if (returnedSerials.includes(serialNumber)) {
      setError(`Serial ${serialNumber} has already been scanned as returned.`);
      setReturnScan("");
      return;
    }
    setReturnedSerials((current) => [...current, serialNumber]);
    setReturnScan("");
    setError("");
  }

  async function handleCompleteServiceReturn() {
    const issue = serviceIssues.find((item) => item.id === returnIssueId);
    if (!issue) return;
    const soldCount = issue.items.length - returnedSerials.length;
    const confirmed = window.confirm(
      `Close ${issue.issueNo}? ${returnedSerials.length} serial(s) will return to stock; ${soldCount} unreturned serial(s) will be recorded as sold and warranty activated under ${issue.dealerName}.`,
    );
    if (!confirmed) return;
    try {
      setServiceSaving(true);
      setError("");
      await completeSuntreeServiceIssue(issue.id, returnedSerials);
      setSuccess(`Service issue ${issue.issueNo} closed. Returned: ${returnedSerials.length}; sold with active warranty: ${soldCount}.`);
      setReturnIssueId("");
      setReturnedSerials([]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete service return.");
    } finally {
      setServiceSaving(false);
    }
  }

  async function addScannedSerial() {
    const serialNumber = scanSerial.replace(/\D/g, "");

    if (!serialNumber) return;

    if (!/^\d{9}$/.test(serialNumber)) {
      setError("Serial barcode must contain exactly 9 digits.");
      return;
    }

    if (serialNumbers.includes(serialNumber)) {
      setError(`Serial ${serialNumber} is already in this shipment.`);
      setScanSerial("");
      return;
    }

    try {
      const serial = await getSerialByNumber(serialNumber);

      if (serial.status !== "IN_STOCK") {
        setError(
          `Serial ${serialNumber} cannot be added because its status is ${serial.status}. Only warehouse IN_STOCK serials can be shipped.`,
        );
        setScanSerial("");
        return;
      }

      if (!serial.productId && !serial.product?.id) {
        setError(
          `Serial ${serialNumber} is not assigned to a product and cannot be shipped.`,
        );
        setScanSerial("");
        return;
      }

      setSerialNumbers((current) =>
        current.includes(serialNumber)
          ? current
          : [...current, serialNumber],
      );
      setScanSerial("");
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? `Serial ${serialNumber} was not added: ${err.message}`
          : `Serial ${serialNumber} was not found in Serial Management.`,
      );
      setScanSerial("");
    }
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

    if (serialNumbers.length === 0) {
      setError("Scan or add at least one serial before creating the shipment.");
      return;
    }

    const dealerName = dealers.find((dealer) => dealer.id === dealerId)?.companyName;
    const confirmed = window.confirm(
      `Create and complete this shipment for ${dealerName ?? "the selected dealer"} with ${serialNumbers.length} serial(s)? The serials will be marked SHIPPED.`,
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createShipmentWithSerials({
        shipmentNo:
          shipmentNo.trim(),
        dealerId,
        shipmentDate,
        remarks:
          remarks.trim() || undefined,
        serialNumbers,
      });

      setSuccess(
        `Shipment ${shipmentNo.trim()} created and completed with ${serialNumbers.length} serial(s).`,
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
    if (shipment.status !== "DRAFT" && !isAdmin) {
      setError(
        "Only an Admin can delete a completed shipment.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Delete shipment ${shipment.shipmentNo}? Unused serials will return to warehouse stock. Shipments with warranty or replacement history cannot be deleted.`,
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

  async function handleConfirmShipment(shipment: Shipment) {
    const dealerName = getDealerName(shipment.dealerId);
    const confirmed = window.confirm(
      `Confirm shipment ${shipment.shipmentNo} to ${dealerName}? Its serials will be marked as shipped and added to the dealer's stock.`,
    );
    if (!confirmed) return;

    try {
      setConfirming(shipment.id);
      setError("");
      setSuccess("");
      await confirmDraftShipment(shipment.id);
      setSuccess(
        `Shipment ${shipment.shipmentNo} is confirmed. Its items are now recorded as shipped to ${dealerName}.`,
      );
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to confirm shipment.",
      );
    } finally {
      setConfirming("");
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

  function printServiceReceipt(issue: SuntreeServiceIssue) {
    const opened = printThermalReceipt({
      brand: "Suntree Myanmar",
      title: "SERVICE ISSUE RECEIPT",
      number: issue.issueNo,
      date: formatDate(issue.issuedDate),
      recipientLabel: "Service Team",
      recipient: `${issue.serviceDepartment} · ${issue.projectName} · ${issue.servicePerson}`,
      status: issue.status,
      note: issue.remarks,
      lines: issue.items.map((item) => ({
        name: item.serial.product?.name ?? "Product",
        code: item.serial.product?.productCode,
        serial: item.serial.serialNumber,
        quantity: 1,
      })),
    });
    if (!opened) window.alert("Allow pop-ups for this dashboard to print the receipt.");
  }

  const serviceSoldIssues = serviceIssues.filter((issue) =>
    issue.items.some((item) => item.disposition === "SOLD"),
  );

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
            title="Stock Out"
            subtitle="Record dealer sales and service team stock issues in one place."
          />
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <button type="button" onClick={() => {
              setError(""); setSuccess(""); setShowServiceForm(false); resetForm(); setShowForm(true); setListMode("SALES");
            }} className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700">
              + Create Shipment
            </button>
            <button type="button" onClick={() => {
              setError(""); setSuccess(""); setShowForm(false); resetServiceForm(); setShowServiceForm(true); setListMode("SERVICE");
            }} className="rounded-xl border border-emerald-700 bg-white px-5 py-3 font-bold text-emerald-800 transition hover:bg-emerald-50">
              Service Issue / Return
            </button>
          </div>
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

        {showServiceForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Service Issue</h2>
                <p className="mt-1 text-sm text-slate-500">Record who took the serials and where they will be used. Scan returned units later to close the issue.</p>
              </div>
              <button type="button" onClick={() => setShowServiceForm(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
            </div>
            <form onSubmit={handleServiceIssue} className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Issue No.
                <input required value={issueNo} onChange={(e) => setIssueNo(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 font-normal" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Service Department
                <input required value={serviceDepartment} onChange={(e) => setServiceDepartment(e.target.value)} placeholder="e.g. Service Department" className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 font-normal" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Project Name
                <input required value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project / site name" className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 font-normal" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Service Person
                <input required value={servicePerson} onChange={(e) => setServicePerson(e.target.value)} placeholder="Technician name" className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 font-normal" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Issue Date
                <input required type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 font-normal" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Remarks
                <input value={serviceRemarks} onChange={(e) => setServiceRemarks(e.target.value)} placeholder="Optional remarks" className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-4 font-normal" />
              </label>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Scan Serial Barcodes</label>
                <div className="flex gap-2">
                  <input value={serviceScan} onChange={(e) => setServiceScan(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addServiceSerial(); } }} placeholder="Scan serial; scanner Enter adds it" inputMode="numeric" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 font-mono text-sm" />
                  <button type="button" onClick={() => void addServiceSerial()} className="rounded-xl border border-slate-300 px-5 font-semibold">Add Serial</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {serviceSerials.map((serial) => <button key={serial} type="button" onClick={() => setServiceSerials((items) => items.filter((item) => item !== serial))} className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm ring-1 ring-slate-200">{serial.replace(/(\d{3})(?=\d)/g, "$1 ")} <span className="text-red-600">×</span></button>)}
                </div>
              </div>
              <div className="flex justify-end md:col-span-2">
                <button disabled={serviceSaving} type="submit" className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white disabled:opacity-60">{serviceSaving ? "Saving..." : "Issue Serials to Service"}</button>
              </div>
            </form>
          </section>
        )}

        {returnIssueId && (() => {
          const issue = serviceIssues.find((item) => item.id === returnIssueId);
          if (!issue) return null;
          return (
            <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Service Return · {issue.issueNo}</h2>
                  <p className="mt-1 text-sm text-slate-500">Scan only the serials physically returned. Anything left unscanned will be recorded as sold and warranty will start.</p>
                </div>
                <button type="button" onClick={() => { setReturnIssueId(""); setReturnedSerials([]); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
              </div>
              <p className="mb-4 text-sm text-slate-600">{issue.serviceDepartment} · {issue.projectName} · {issue.servicePerson}</p>
              <div className="flex gap-2">
                <input value={returnScan} onChange={(e) => setReturnScan(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addReturnedSerial(); } }} placeholder="Scan returned serial and press Enter" inputMode="numeric" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 font-mono text-sm" />
                <button type="button" onClick={() => void addReturnedSerial()} className="rounded-xl border border-slate-300 px-5 font-semibold">Add Return</button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {issue.items.filter((item) => item.disposition === "ISSUED").map((item) => {
                  const returned = returnedSerials.includes(item.serial.serialNumber);
                  return <div key={item.id} className={`rounded-xl border px-3 py-2 text-sm ${returned ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                    <span className="font-mono">{item.serial.serialNumber.replace(/(\d{3})(?=\d)/g, "$1 ")}</span>
                    <span className="float-right font-semibold">{returned ? "Returned" : "Pending"}</span>
                  </div>;
                })}
              </div>
              <div className="mt-5 flex justify-end">
                <button type="button" disabled={serviceSaving} onClick={() => void handleCompleteServiceReturn()} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white disabled:opacity-60">{serviceSaving ? "Saving..." : "Complete Return & Record Sales"}</button>
              </div>
            </section>
          );
        })()}

        {/* Create Form */}
        {showForm && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Create Shipment
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter shipment details and scan the serial barcodes, then save once.
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
                        {dealer.dealerCode} — {dealer.companyName}
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

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Scan / Enter Serial Barcodes
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanSerial}
                    onChange={(event) => setScanSerial(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addScannedSerial();
                      }
                    }}
                    placeholder="Scan barcode here; press Enter after each serial"
                    inputMode="numeric"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 font-mono text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    type="button"
                    onClick={addScannedSerial}
                    className="shrink-0 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Add Serial
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  A barcode scanner that types into the field and sends Enter will add each serial automatically.
                </p>

                {serialNumbers.length > 0 && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 text-sm font-semibold text-slate-700">
                      {serialNumbers.length} serial(s) scanned
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {serialNumbers.map((serialNumber) => (
                        <span
                          key={serialNumber}
                          className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-mono text-sm text-slate-700 ring-1 ring-slate-200"
                        >
                          {serialNumber.replace(/(\d{3})(?=\d)/g, "$1 ")}
                          <button
                            type="button"
                            onClick={() =>
                              setSerialNumbers((current) =>
                                current.filter((value) => value !== serialNumber),
                              )
                            }
                            aria-label={`Remove serial ${serialNumber}`}
                            className="font-sans font-bold text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Creating..."
                    : "Create & Complete Shipment"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Shipment List */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {listMode === "SALES" ? "Sales / Shipment List" : "Service Issue / Return List"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {listMode === "SALES" ? `${shipments.length} dealer shipment(s) · ${serviceSoldIssues.length} service sale(s)` : `${serviceIssues.length} service issue(s) recorded.`}
                </p>
              </div>
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button type="button" onClick={() => setListMode("SALES")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${listMode === "SALES" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Sales</button>
                <button type="button" onClick={() => setListMode("SERVICE")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${listMode === "SERVICE" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Service Use</button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Loading shipments...
            </div>
          ) : listMode === "SALES" && shipments.length === 0 && serviceSoldIssues.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-semibold text-slate-700">
                No shipments found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create a shipment to get started.
              </p>
            </div>
          ) : listMode === "SALES" ? (
            <>
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
                  {shipments.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">No dealer shipments recorded yet.</td></tr>}
                  {shipments.map(
                    (shipment) => (
                      <tr
                        key={shipment.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-900">
                          <Link
                            href={`/shipments/${shipment.id}`}
                            className="text-emerald-700 hover:underline"
                          >
                            {shipment.shipmentNo}
                          </Link>
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
                          <Link
                            href={`/shipments/${shipment.id}`}
                            className="mr-2 inline-flex rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            View
                          </Link>
                          {shipment.status === "DRAFT" && canConfirmShipments && (
                            <button
                              type="button"
                              onClick={() => void handleConfirmShipment(shipment)}
                              disabled={confirming === shipment.id}
                              className="mr-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {confirming === shipment.id ? "Confirming..." : "Confirm"}
                            </button>
                          )}
                          {(shipment.status ===
                            "DRAFT" || isAdmin) && (
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
          {serviceSoldIssues.length > 0 && <div className="border-t border-slate-200">
            <div className="bg-slate-50 px-6 py-3 text-sm font-bold text-slate-700">Sales from Service Projects</div>
            <div className="divide-y divide-slate-100">
              {serviceSoldIssues.map((issue) => {
                const soldItems = issue.items.filter((item) => item.disposition === "SOLD");
                return <div key={issue.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div><p className="font-semibold text-slate-800">{issue.serviceDepartment} · {issue.projectName}</p><p className="mt-1 text-xs text-slate-500">{issue.issueNo} · {formatDate(issue.issuedDate)} · Dealer label: {issue.dealerName}</p><div className="mt-2 flex flex-wrap gap-2">{soldItems.map((item) => <span key={item.id} className="rounded-md bg-blue-50 px-2 py-1 font-mono text-xs text-blue-800">{item.serial.serialNumber.replace(/(\d{3})(?=\d)/g, "$1 ")}</span>)}</div></div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">{soldItems.length} sold · Warranty active</span>
                </div>;
              })}
            </div>
          </div>}
            </>
          ) : serviceIssues.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-semibold text-slate-700">No service issues found.</p>
              <p className="mt-1 text-sm text-slate-500">Create a service issue to record serials taken by the service team.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {serviceIssues.map((issue) => {
                const returnedCount = issue.items.filter((item) => item.disposition === "RETURNED").length;
                const soldCount = issue.items.filter((item) => item.disposition === "SOLD").length;
                const outstandingCount = issue.items.filter((item) => item.disposition === "ISSUED").length;
                return <article key={issue.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-emerald-700">{issue.issueNo}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${issue.status === "OPEN" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{issue.status}</span>
                      </div>
                      <p className="mt-2 font-semibold text-slate-900">{issue.serviceDepartment} · {issue.projectName}</p>
                      <p className="mt-1 text-sm text-slate-500">Service person: {issue.servicePerson} · Issued: {formatDate(issue.issuedDate)}</p>
                      {issue.remarks && <p className="mt-1 text-sm text-slate-500">{issue.remarks}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5">{issue.items.length} issued</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">{returnedCount} returned</span>
                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">{soldCount} sold · warranty active</span>
                      <button type="button" onClick={() => printServiceReceipt(issue)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"><Printer size={15} /> Print 80 mm</button>
                      {issue.status === "OPEN" && <button type="button" onClick={() => { setError(""); setReturnIssueId(issue.id); setReturnedSerials([]); setReturnScan(""); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Return</button>}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {issue.items.map((item) => <span key={item.id} className={`rounded-lg px-3 py-2 font-mono text-xs ${item.disposition === "RETURNED" ? "bg-emerald-50 text-emerald-800" : item.disposition === "SOLD" ? "bg-blue-50 text-blue-800" : "bg-amber-50 text-amber-800"}`} title={item.serial.product?.name ?? ""}>{item.serial.serialNumber.replace(/(\d{3})(?=\d)/g, "$1 ")} · {item.disposition}</span>)}
                  </div>
                  {issue.status === "OPEN" && <p className="mt-3 text-xs text-slate-500">{outstandingCount} serial(s) still awaiting return scan. Unscanned serials become sold and are registered for warranty when the issue is closed.</p>}
                </article>;
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
