"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = QuickActionCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
function QuickActionCard({ title, description, href, }) {
    return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: href, className: "group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-emerald-500 hover:shadow-lg", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-slate-900", children: title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-slate-500", children: description })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 transition-all group-hover:bg-emerald-600", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowUpRight, { size: 20, className: "text-slate-600 group-hover:text-white" }) })] }));
}
//# sourceMappingURL=QuickActionCard.js.map