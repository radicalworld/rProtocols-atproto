// src/components/ProtocolBadge.tsx
import { Stage } from "@/features/protocols/lib/releases";

export default function ProtocolBadge({ version, stage }: { version: string; stage: Stage }) {
    const palette: Record<Stage, string> = {
        draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
        rc: "bg-blue-100 text-blue-800 border-blue-200",
        published: "bg-green-100 text-green-800 border-green-200",
        archived: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${palette[stage]}`}>
        <span>{version}</span>
        {stage !== "published" && <span className="uppercase tracking-wide">{stage}</span>}
        </span>
    );
}