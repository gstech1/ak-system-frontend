import Image from "next/image";
import {
  CircleCheckBig,
  CircleX,
  TriangleAlert,
  CalendarDays,
  MapPin,
  Store,
  Package,
  ScanBarcode,
} from "lucide-react";

export type WarrantyStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "NOT_REGISTERED"
  | "NOT_FOUND"
  | "PENDING"
  | "VOID";

type Props = {
  status: WarrantyStatus;
  product?: string;
  productCode?: string;
  serialNumber?: string;
  warrantyStart?: string | null;
  warrantyEnd?: string | null;
  dealer?: string;
  location?: string;
  customerName?: string;
  warrantyNo?: string;
};

export default function WarrantyResultCard(props: Props) {
  const {
    status,
    product,
    productCode,
    serialNumber,
    warrantyStart,
    warrantyEnd,
    dealer,
    location,
    customerName,
    warrantyNo,
  } = props;

  /* =====================================================
     SERIAL NOT FOUND
     ===================================================== */

  if (status === "NOT_FOUND") {
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-lg">

        <div className="bg-gradient-to-r from-red-700 to-red-500 p-5">

          <div className="flex justify-center">
            <Image
              src="/images/logo/suntree-logo.png"
              alt="Suntree Myanmar"
              width={120}
              height={120}
            />
          </div>

          <div className="mt-4 flex justify-center">
            <TriangleAlert className="h-16 w-16 text-yellow-300" />
          </div>

          <h2 className="mt-4 text-center text-2xl font-bold text-white">
            SERIAL NOT FOUND
          </h2>

          <p className="mt-2 text-center text-red-100">
            This serial number does not exist in our warranty system.
          </p>

        </div>

      </div>
    );
  }

  /* =====================================================
     WARRANTY NOT REGISTERED
     ===================================================== */

  if (status === "NOT_REGISTERED") {
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-lg">

        {/* Header */}

        <div className="bg-gradient-to-r from-amber-600 to-orange-500 p-5">

          <div className="flex justify-center">
            <Image
              src="/images/logo/suntree-logo.png"
              alt="Suntree Myanmar"
              width={120}
              height={120}
            />
          </div>

          <div className="mt-4 flex justify-center">
            <TriangleAlert className="h-16 w-16 text-white" />
          </div>

          <h2 className="mt-4 text-center text-2xl font-bold text-white">
            WARRANTY NOT REGISTERED
          </h2>

          <p className="mt-2 text-center text-amber-50">
            This product has not been registered for warranty yet.
          </p>

        </div>

        {/* Body */}

        <div className="space-y-4 p-5">

          <InfoRow
            icon={<Package size={18} />}
            label="Product"
            value={product || "-"}
          />

          <InfoRow
            icon={<ScanBarcode size={18} />}
            label="Serial Number"
            value={serialNumber || "-"}
          />

          <InfoRow
            icon={<Store size={18} />}
            label="Dealer"
            value={dealer || "-"}
          />

          <InfoRow
            icon={<CalendarDays size={18} />}
            label="Warranty Period"
            value="Not registered"
          />

        </div>

      </div>
    );
  }

  /* =====================================================
     ACTIVE / EXPIRED / PENDING / VOID
     ===================================================== */

  const active = status === "ACTIVE";
  const pending = status === "PENDING";
  const voidWarranty = status === "VOID";

  let title = "WARRANTY EXPIRED";

  if (active) {
    title = "WARRANTY ACTIVE";
  } else if (pending) {
    title = "WARRANTY PENDING";
  } else if (voidWarranty) {
    title = "WARRANTY VOID";
  }

  return (
    <div
      className={`mt-6 overflow-hidden rounded-2xl border bg-white shadow-lg ${
        active
          ? "border-emerald-200"
          : pending
            ? "border-amber-200"
            : "border-red-200"
      }`}
    >

      {/* Header */}

      <div
        className={`p-5 ${
          active
            ? "bg-gradient-to-r from-emerald-700 to-emerald-500"
            : pending
              ? "bg-gradient-to-r from-amber-600 to-orange-500"
              : "bg-gradient-to-r from-red-700 to-red-500"
        }`}
      >

        <div className="flex justify-center">
          <Image
            src="/images/logo/suntree-logo.png"
            alt="Suntree Myanmar"
            width={120}
            height={120}
          />
        </div>

        <div className="mt-4 flex justify-center">

          {active ? (
            <CircleCheckBig className="h-16 w-16 text-white" />
          ) : pending ? (
            <TriangleAlert className="h-16 w-16 text-white" />
          ) : (
            <CircleX className="h-16 w-16 text-white" />
          )}

        </div>

        <h2 className="mt-4 text-center text-2xl font-bold text-white">
          {title}
        </h2>

      </div>

      {/* Body */}

      <div className="space-y-4 p-5">

        <InfoRow
          icon={<Package size={18} />}
          label="Product"
          value={product || "-"}
        />

        <InfoRow
          icon={<ScanBarcode size={18} />}
          label="Serial Number"
          value={serialNumber || "-"}
        />

        {productCode && (
          <InfoRow
            icon={<Package size={18} />}
            label="Product Code"
            value={productCode}
          />
        )}

        <InfoRow
          icon={<CalendarDays size={18} />}
          label="Warranty Period"
          value={`${formatDate(warrantyStart)}  →  ${formatDate(warrantyEnd)}`}
        />

        <InfoRow
          icon={<Store size={18} />}
          label="Dealer"
          value={dealer || "-"}
        />

        {location && (
          <InfoRow
            icon={<MapPin size={18} />}
            label="Location"
            value={location}
          />
        )}

        {warrantyNo && (
          <InfoRow
            icon={<ScanBarcode size={18} />}
            label="Warranty Number"
            value={warrantyNo}
          />
        )}

        {customerName && (
          <InfoRow
            icon={<Store size={18} />}
            label="Customer"
            value={customerName}
          />
        )}

      </div>

    </div>
  );
}

/* =====================================================
   DATE FORMAT
   ===================================================== */

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB");
}

/* =====================================================
   INFO ROW
   ===================================================== */

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function InfoRow({
  icon,
  label,
  value,
}: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

      <div className="mt-1 text-emerald-600">
        {icon}
      </div>

      <div className="flex-1">

        <p className="text-xs uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-all font-semibold text-slate-800">
          {value}
        </p>

      </div>

    </div>
  );
}