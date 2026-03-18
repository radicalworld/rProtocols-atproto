// src/components/ProtocolBadge.tsx
import type { Stage } from "@/domain/types";

export default function ProtocolBadge({ version, stage }: { version: string; stage: Stage }) {
    const palette: Record<string, string> = {
        draft: "bg-gray-100 text-gray-700",
        candidate: "bg-yellow-100 text-yellow-800",
        stable: "bg-green-100 text-green-800",
        deprecated: "bg-red-100 text-red-800",
        archived: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${palette[stage]}`}>
            <span>{version}</span>
        </span>
    );
}