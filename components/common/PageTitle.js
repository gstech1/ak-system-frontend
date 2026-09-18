"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PageTitle;
const jsx_runtime_1 = require("react/jsx-runtime");
function PageTitle({ title, subtitle, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold text-slate-900", children: title }), subtitle && ((0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-slate-500", children: subtitle }))] }));
}
//# sourceMappingURL=PageTitle.js.map