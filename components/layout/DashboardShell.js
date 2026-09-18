"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardShell;
const jsx_runtime_1 = require("react/jsx-runtime");
const Header_1 = __importDefault(require("./Header"));
const Sidebar_1 = __importDefault(require("./Sidebar"));
function DashboardShell({ children, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex h-screen bg-slate-100", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col", children: [(0, jsx_runtime_1.jsx)(Header_1.default, {}), (0, jsx_runtime_1.jsx)("main", { className: "flex-1 p-6", children: children })] })] }));
}
//# sourceMappingURL=DashboardShell.js.map