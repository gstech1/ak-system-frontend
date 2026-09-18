"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Sidebar;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const menu_1 = require("@/constants/menu");
function Sidebar() {
    const pathname = (0, navigation_1.usePathname)();
    return ((0, jsx_runtime_1.jsxs)("aside", { className: "flex h-screen w-72 flex-col bg-slate-900 text-white", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border-b border-slate-800 p-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-black tracking-wide text-emerald-400", children: "AK SYSTEM" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-slate-400", children: "Website CMS" })] }), (0, jsx_runtime_1.jsx)("nav", { className: "flex-1 space-y-2 p-4", children: menu_1.SIDEBAR_MENU.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: item.href, className: `flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${active
                            ? "bg-emerald-600 text-white shadow-lg"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"}`, children: [(0, jsx_runtime_1.jsx)(Icon, { size: 18 }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: item.title })] }, item.href));
                }) }), (0, jsx_runtime_1.jsx)("div", { className: "border-t border-slate-800 p-5", children: (0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl bg-slate-800 p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-white", children: "AK System" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-slate-400", children: "Version 1.0.0" })] }) })] }));
}
//# sourceMappingURL=Sidebar.js.map