import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useRepo } from "@/domain/repo";
import { FollowEye } from "@/features/marks/FollowEye";
import { Link } from "react-router-dom";
export function ProtocolExpanded({ protocolId }) {
    const repo = useRepo();
    const [p, setP] = useState(null);
    useEffect(() => {
        let m = true;
        (async () => {
            // TODO: add repo.getProtocol(id). For now, try to find it via suites you're already using.
            const candidates = await repo.getSuiteProtocols("suite-root-protocols");
            const testProto = p || { id: "test", lineageId: "test", slug: "test", title: "Test Protocol", summary: "A placeholder protocol description.", body: "## Usage\nTest usage content." };
            const found = candidates.find((x) => x.id === protocolId);
            if (m)
                setP(found ?? { id: protocolId, title: protocolId, lineageId: protocolId, slug: protocolId });
        })();
        return () => { m = false; };
    }, [repo, protocolId]);
    return (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-sm text-gray-700", children: p?.summary ?? "Protocol details" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FollowEye, { subjectId: protocolId, label: "Follow protocol" }), _jsx(Link, { to: `/protocol/${encodeURIComponent(protocolId)}`, className: "text-xs underline decoration-dotted underline-offset-4 text-gray-700", children: "Open" })] })] }));
}
