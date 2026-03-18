import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ProtocolActions.tsx
import { useRepo } from "@/domain/repo";
export function ProtocolActions({ protocolId }) {
    const repo = useRepo();
    return (_jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => repo.follow(protocolId), className: "rounded-lg border px-2 py-1 text-xs", children: "Follow" }), _jsx("button", { onClick: () => repo.adopt(protocolId), className: "rounded-lg bg-black px-2 py-1 text-xs text-white", children: "Adopt" })] }));
}
