"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DataTable;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const StatusBadge_1 = __importDefault(require("@/components/common/StatusBadge"));
function DataTable({ columns, }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-slate-100", children: (0, jsx_runtime_1.jsx)("tr", { children: columns.map((column) => ((0, jsx_runtime_1.jsx)("th", { className: "px-5 py-4 text-left text-sm font-semibold text-slate-700", children: column.title }, column.key))) }) }), (0, jsx_runtime_1.jsx)("tbody", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-t border-slate-200", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4", children: (0, jsx_runtime_1.jsx)("div", { className: "h-14 w-20 rounded-lg bg-slate-200" }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4 font-medium", children: "Summer Promotion 2026" }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4", children: "02 Aug 2026" }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4", children: (0, jsx_runtime_1.jsx)(StatusBadge_1.default, { status: "Active" }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end gap-2", children: [(0, jsx_runtime_1.jsx)("button", { className: "rounded-lg border border-slate-200 p-2 hover:bg-slate-100", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Pencil, { size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { className: "rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 16 }) })] }) })] }) })] }) }));
}
//# sourceMappingURL=DataTable.js.map