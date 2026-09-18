"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StatCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
function StatCard({ title, value, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-50 blur-2xl" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium uppercase tracking-wide text-slate-500", children: title }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-3 text-4xl font-black text-slate-900", children: value }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm font-medium text-emerald-600", children: "+12% This Month" })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 transition-all group-hover:bg-emerald-600", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 24, className: "text-emerald-600 group-hover:text-white" }) })] })] }));
}
//# sourceMappingURL=StatCard.js.map