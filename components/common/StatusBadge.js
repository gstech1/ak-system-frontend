"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StatusBadge;
const jsx_runtime_1 = require("react/jsx-runtime");
function StatusBadge({ status, }) {
    const active = status === "Active";
    return ((0, jsx_runtime_1.jsx)("span", { className: `inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-700"}`, children: status }));
}
//# sourceMappingURL=StatusBadge.js.map