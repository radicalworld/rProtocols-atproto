import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// components/Breadcrumbs.tsx
import { Link } from "react-router-dom";
export default function Breadcrumbs({ items }) {
    return (_jsx("div", { className: "text-sm text-gray-600 mb-4", children: items.map((item, i) => (_jsxs("span", { children: [item.href ? _jsx(Link, { to: item.href, className: "hover:underline", children: item.label }) : item.label, i < items.length - 1 && " / "] }, i))) }));
}
