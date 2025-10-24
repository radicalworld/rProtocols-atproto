// ListCard.tsx
import { useState } from "react";

export function ListCard({
        title,
        items,
        empty,
        actionRenderer,
        expandedRenderer,
        max = 6,
    }: {
        title: string;
        items: { id: string; title: string; subtitle?: string }[];
        empty: string;
        actionRenderer?: (id: string, isOpen: boolean) => React.ReactNode; // ⬅️ pass isOpen
        expandedRenderer?: (id: string) => React.ReactNode;
        max?: number;
    }) {
        
    const [openId, setOpenId] = useState<string | null>(null);
    const visible = items.slice(0, max);
    const extra = items.length - visible.length;

    return (
        <div className="rounded-xl border bg-gray-50 p-4">
        <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium">{title}</h4>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 border">{items.length}</span>
        </div>

        {items.length === 0 ? (
            <p className="text-sm text-gray-500">{empty}</p>
        ) : (
            <ul className="space-y-2">
            {visible.map((it) => {
                const isOpen = openId === it.id;
                return (
                <li key={it.id} className="group rounded-lg border bg-white">
                    <div
                        role="button"
                        tabIndex={0}
                        className="flex w-full items-start justify-between gap-2 p-3 text-left"
                        onClick={() => setOpenId(isOpen ? null : it.id)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setOpenId(isOpen ? null : it.id);
                            }
                        }}
                        aria-expanded={isOpen}
                    >
                    <div>
                        <div className="text-sm font-medium">{it.title}</div>
                        {it.subtitle && <div className="text-xs text-gray-600 line-clamp-2">{it.subtitle}</div>}
                    </div>

                    {actionRenderer && (
                        <div
                        className={
                            // hidden by default; show on hover OR if open
                            `shrink-0 transition-opacity ${
                            isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                        {actionRenderer(it.id, isOpen)}
                        </div>
                    )}
                    </div>

                    {isOpen && expandedRenderer && <div className="border-t p-3">{expandedRenderer(it.id)}</div>}
                </li>
                );
            })}
            </ul>
        )}

        {extra > 0 && <div className="mt-2 text-xs text-gray-600">+{extra} more</div>}
        </div>
    );
}