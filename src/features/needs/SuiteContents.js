import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useRepo } from "@/domain/repo";
import { FollowEye } from "@/features/marks/FollowEye";
import { useLocation, Link } from "react-router-dom";
export function SuiteContents({ suiteId, suiteSlug, onSelectProtocol }) {
    const repo = useRepo();
    const location = useLocation();
    const pathParts = location.pathname.split("/").filter(Boolean);
    const section = pathParts[0] || "collaboration";
    const effectiveSuiteSlug = suiteSlug || suiteId;
    const [protocols, setProtocols] = useState([]);
    useEffect(() => {
        let m = true;
        (async () => {
            const ps = await repo.getSuiteProtocols(suiteId);
            if (m)
                setProtocols(ps);
        })();
        return () => { m = false; };
    }, [repo, suiteId]);
    if (!protocols.length)
        return _jsx("div", { className: "text-sm text-gray-600", children: "No protocols yet." });
    return (_jsx("ul", { className: "space-y-2", children: protocols.map((p) => (_jsxs("li", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: onSelectProtocol ? (_jsx("button", { onClick: (e) => { e.preventDefault(); onSelectProtocol(p.id); }, className: "hover:underline text-left", children: p.title })) : (_jsx(Link, { to: `/${section}/protocols/${encodeURIComponent(p.id)}?suite=${effectiveSuiteSlug}`, className: "hover:underline", children: p.title })) }), p.summary && _jsx("div", { className: "text-xs text-gray-600", children: p.summary })] }), _jsx(FollowEye, { subjectId: p.id, label: "Follow protocol" })] }, p.id))) }));
}
