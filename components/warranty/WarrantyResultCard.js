"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WarrantyResultCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const image_1 = __importDefault(require("next/image"));
const lucide_react_1 = require("lucide-react");
function WarrantyResultCard(props) {
    const { status, product, productCode, serialNumber, warrantyStart, warrantyEnd, dealer, location, customerName, warrantyNo, } = props;
    /* =====================================================
       SERIAL NOT FOUND
       ===================================================== */
    if (status === "NOT_FOUND") {
        return ((0, jsx_runtime_1.jsx)("div", { className: "mt-6 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-lg", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-gradient-to-r from-red-700 to-red-500 p-5", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex justify-center", children: (0, jsx_runtime_1.jsx)(image_1.default, { src: "/images/logo/suntree-logo.png", alt: "Suntree Myanmar", width: 120, height: 120 }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4 flex justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TriangleAlert, { className: "h-16 w-16 text-yellow-300" }) }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-4 text-center text-2xl font-bold text-white", children: "SERIAL NOT FOUND" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-center text-red-100", children: "This serial number does not exist in our warranty system." })] }) }));
    }
    /* =====================================================
       WARRANTY NOT REGISTERED
       ===================================================== */
    if (status === "NOT_REGISTERED") {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "mt-6 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-lg", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-gradient-to-r from-amber-600 to-orange-500 p-5", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex justify-center", children: (0, jsx_runtime_1.jsx)(image_1.default, { src: "/images/logo/suntree-logo.png", alt: "Suntree Myanmar", width: 120, height: 120 }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4 flex justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.TriangleAlert, { className: "h-16 w-16 text-white" }) }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-4 text-center text-2xl font-bold text-white", children: "WARRANTY NOT REGISTERED" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-center text-amber-50", children: "This product has not been registered for warranty yet." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 p-5", children: [(0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 18 }), label: "Product", value: product || "-" }), (0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.ScanBarcode, { size: 18 }), label: "Serial Number", value: serialNumber || "-" }), (0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Store, { size: 18 }), label: "Dealer", value: dealer || "-" }), (0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.CalendarDays, { size: 18 }), label: "Warranty Period", value: "Not registered" })] })] }));
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
    }
    else if (pending) {
        title = "WARRANTY PENDING";
    }
    else if (voidWarranty) {
        title = "WARRANTY VOID";
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: `mt-6 overflow-hidden rounded-2xl border bg-white shadow-lg ${active
            ? "border-emerald-200"
            : pending
                ? "border-amber-200"
                : "border-red-200"}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `p-5 ${active
                    ? "bg-gradient-to-r from-emerald-700 to-emerald-500"
                    : pending
                        ? "bg-gradient-to-r from-amber-600 to-orange-500"
                        : "bg-gradient-to-r from-red-700 to-red-500"}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "flex justify-center", children: (0, jsx_runtime_1.jsx)(image_1.default, { src: "/images/logo/suntree-logo.png", alt: "Suntree Myanmar", width: 120, height: 120 }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4 flex justify-center", children: active ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CircleCheckBig, { className: "h-16 w-16 text-white" })) : pending ? ((0, jsx_runtime_1.jsx)(lucide_react_1.TriangleAlert, { className: "h-16 w-16 text-white" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.CircleX, { className: "h-16 w-16 text-white" })) }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-4 text-center text-2xl font-bold text-white", children: title })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 p-5", children: [(0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 18 }), label: "Product", value: product || "-" }), (0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.ScanBarcode, { size: 18 }), label: "Serial Number", value: serialNumber || "-" }), productCode && ((0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Package, { size: 18 }), label: "Product Code", value: productCode })), (0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.CalendarDays, { size: 18 }), label: "Warranty Period", value: `${formatDate(warrantyStart)}  →  ${formatDate(warrantyEnd)}` }), (0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Store, { size: 18 }), label: "Dealer", value: dealer || "-" }), location && ((0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { size: 18 }), label: "Location", value: location })), warrantyNo && ((0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.ScanBarcode, { size: 18 }), label: "Warranty Number", value: warrantyNo })), customerName && ((0, jsx_runtime_1.jsx)(InfoRow, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Store, { size: 18 }), label: "Customer", value: customerName }))] })] }));
}
/* =====================================================
   DATE FORMAT
   ===================================================== */
function formatDate(value) {
    if (!value) {
        return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString("en-GB");
}
function InfoRow({ icon, label, value, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "mt-1 text-emerald-600", children: icon }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs uppercase tracking-wide text-slate-500", children: label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 break-all font-semibold text-slate-800", children: value })] })] }));
}
//# sourceMappingURL=WarrantyResultCard.js.map