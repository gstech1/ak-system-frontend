"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PageLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const Header_1 = __importDefault(require("./Header"));
const Sidebar_1 = __importDefault(require("./Sidebar"));
function PageLayout({ children }) {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Header_1.default, {}), (0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsx)("main", { children: children })] }));
}
//# sourceMappingURL=PageLayout.js.map