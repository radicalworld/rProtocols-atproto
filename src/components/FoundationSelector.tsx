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
            try {
                if ((repo as any).getSuites) {
                    const results = await (repo as any).getSuites();
                    if (alive) {
                        setSuites(results);
                        setLoading(false);
                    }
                } else {
                    if (alive) setLoading(false);
                }
            } catch (e) {
                console.error("Failed to load suites", e);
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [repo]);

    return (
        <div className="mt-4 mb-2">
            <div className="text-sm font-medium text-gray-700 mb-1.5">
                Grounding Protocols
            </div>
            <div className="relative">
                <select
                    className={`w-full appearance-none text-base rounded-xl border border-gray-300 pl-3 pr-10 py-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white cursor-pointer"}`}
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Select the foundational system granting semantic derivation context.</p>
        </div>
    );
}
