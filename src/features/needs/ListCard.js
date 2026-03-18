import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ListCard.tsx
import { useState } from "react";
export function ListCard({ title, items, empty, actionRenderer, expandedRenderer, onItemClick, activeItem, max = 6, }) {
    const [openId, setOpenId] = useState(null);
    const visible = items.slice(0, max);
    const extra = items.length - visible.length;
    // determine if an item is open via controlled prop OR local state
    const isItemOpen = (itemId, itemSlug) => {
        if (activeItem === itemSlug || activeItem === itemId)
            return true;
        return openId === itemId;
    };
    return (_jsxs("div", { className: "rounded-xl border bg-gray-50 p-4", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsx("h4", { className: "font-medium", children: title }), _jsx("span", { className: "rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 border", children: items.length })] }), items.length === 0 ? (_jsx("p", { className: "text-sm text-gray-500", children: empty })) : (_jsx("ul", { className: "space-y-2", children: visible.map((it) => {
                    const itemSlug = encodeURIComponent(it.title.replace(/\s+/g, '_'));
                    const isOpen = isItemOpen(it.id, itemSlug);
                    return (_jsxs("li", { className: "group rounded-lg border bg-white", children: [_jsxs("div", { role: "button", tabIndex: 0, className: "flex w-full items-start justify-between gap-2 p-3 text-left", onClick: () => {
                                    if (onItemClick) {
                                        onItemClick(it.id);
                                    }
                                    else {
                                        setOpenId(isOpen ? null : it.id);
                                    }
                                }, onKeyDown: (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        if (onItemClick) {
                                            onItemClick(it.id);
                                        }
                                        else {
                                            setOpenId(isOpen ? null : it.id);
                                        }
                                    }
                                }, "aria-expanded": isOpen, children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: it.title }), it.subtitle && _jsx("div", { className: "text-xs text-gray-600 line-clamp-2", children: it.subtitle })] }), actionRenderer && (_jsx("div", { className: 
                                        // hidden by default; show on hover OR if open
                                        `shrink-0 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`, onClick: (e) => e.stopPropagation(), onKeyDown: (e) => e.stopPropagation(), children: actionRenderer(it.id, isOpen) }))] }), isOpen && expandedRenderer && _jsx("div", { className: "border-t p-3", children: expandedRenderer(it.id) })] }, it.id));
                }) })), extra > 0 && _jsxs("div", { className: "mt-2 text-xs text-gray-600", children: ["+", extra, " more"] })] }));
}
