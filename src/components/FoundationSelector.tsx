import { useEffect, useState } from "react";
import { useRepo } from "@/domain/repo";
import type { Suite } from "@/domain/types";

export function FoundationSelector({
    value,
    onChange,
    disabled = false
}: {
    value: string;
    onChange: (uri: string) => void;
    disabled?: boolean;
}) {
    const repo = useRepo();
    const [suites, setSuites] = useState<Suite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            if ((repo as any).getSuites) {
                const results = await (repo as any).getSuites();
                if (alive) {
                    setSuites(results);
                    setLoading(false);
                }
            } else {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [repo]);

    return (
        <label className="block mt-4 mb-2">
            <div className="text-sm font-medium text-gray-700">
                Grounding Protocols
            </div>
            <select
                className={`mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                value={value || "suite-root-protocols"}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled || loading}
            >
                {loading ? (
                    <option value="suite-root-protocols">Loading protocols...</option>
                ) : (
                    <>
                        <option value="suite-root-protocols">Core Proto-Protocols Suite</option>
                        {suites.filter(s => s.lineageId !== "suite-root-protocols").map(s => (
                            <option key={s.lineageId} value={s.lineageId}>
                                {s.title || s.lineageId}
                            </option>
                        ))}
                    </>
                )}
            </select>
            <p className="text-xs text-gray-500 mt-1">Select the foundational system granting semantic derivation context.</p>
        </label>
    );
}
