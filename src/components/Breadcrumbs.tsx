// components/Breadcrumbs.tsx

import { Link } from "react-router-dom";

export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
    return (
        <div className="text-sm text-gray-600 mb-4">
        {items.map((item, i) => (
            <span key={i}>
                {item.href ? <Link to={item.href} className="hover:underline">{item.label}</Link> : item.label}
                {i < items.length - 1 && " / "}
            </span>
        ))}
        </div>
    );
}