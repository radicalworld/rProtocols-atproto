import { Stage } from "@/domain/types";

export function StatusBadge({ version, stage, type = "status" }: { version: string; stage: Stage | "stable", type?: "version" | "status" | "language" }) {
    if (type === "language") {
        return (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-200 uppercase tracking-widest leading-none">
                {version}
            </span>
        );
    }
    
    // Aesthetic mapping aligned with Protocol/Suite header screenshots
    const palette: Record<string, string> = {
        draft: "bg-slate-50 text-slate-700 border-slate-700",
        candidate: "bg-blue-50 text-blue-700 border-blue-700",
        stable: "bg-green-50 text-green-700 border-green-700",
        deprecated: "bg-red-50 text-red-700 border-red-700",
        archived: "bg-gray-50 text-gray-600 border-gray-300",
    };

    const activePalette = palette[stage] || palette["stable"];

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border leading-none ${activePalette}`}>
            {version}
        </span>
    );
}
