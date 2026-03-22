import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useRepo } from "@/domain/repo";
import type { Suite, Protocol } from "@/domain/types";
import { SuiteIcon } from "@/components/icons/SuiteIcon";
import { VersionHeader } from "@/components/VersionHeader";

export function SuiteDrawer({ 
    suiteId, 
    isOpen, 
    onClose 
}: { 
    suiteId?: string | null, 
    isOpen: boolean, 
    onClose: () => void 
}) {
    const repo = useRepo();
    const [suite, setSuite] = useState<Suite | null>(null);
    const [loading, setLoading] = useState(false);
    const [protocols, setProtocols] = useState<Protocol[]>([]);

    useEffect(() => {
        if (!isOpen || !suiteId) return;
        let alive = true;
        setLoading(true);

        (async () => {
             try {
                // Strip "rp_" if present to find it reliably via standard getSuite
                let cleanId = suiteId;
                if (cleanId.startsWith("rp_")) cleanId = cleanId.replace(/^(rp_st_|rp_pr_|rp_nd_|rp_)/, "");
                
                const s = await repo.getSuite(cleanId);
                let pList: Protocol[] = [];
                if (s && s.includeProtocols && s.includeProtocols.length > 0) {
                    pList = await repo.getSuiteProtocols(s.lineageId || s.id);
                }

                if (alive) {
                     setSuite(s);
                     setProtocols(pList);
                     setLoading(false);
                }
             } catch(e) {
                 if (alive) setLoading(false);
             }
        })();
        
        return () => { alive = false; };
    }, [isOpen, suiteId, repo]);

    if (!isOpen) return null;

    const versionString = suite?.version || "1.0.0";
    const uiStageDisplay = suite?.stage === "stable" ? "Active" :
                           suite?.stage === "candidate" ? "In Review" :
                           suite?.stage === "deprecated" ? "Retired" : "Evolving";

    const tags = suite?.tags || [];

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
            <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {loading ? (
                    <div className="flex items-center justify-center p-12 h-full text-gray-500">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
                        Loading Foundation...
                    </div>
                ) : !suite ? (
                    <div className="p-12 text-center text-gray-500 h-full flex flex-col items-center justify-center">
                        <SuiteIcon className="text-gray-300 w-12 h-12 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Suite Not Found</h3>
                        <p className="text-sm">The selected grounding protocol context could not be resolved from the relay.</p>
                    </div>
                ) : (
                    <div className="p-8 pb-16 flex-1 flex flex-col gap-8 mt-4">
                        <div>
                            <div className="flex items-start gap-3 mb-4">
                                <SuiteIcon className="text-blue-600 w-7 h-7 flex-shrink-0 mt-0.5" />
                                <h2 className="text-2xl font-bold text-gray-900 leading-tight pr-8">
                                    {suite.title}
                                </h2>
                            </div>
                            
                            <VersionHeader 
                                versionString={versionString} 
                                uiStageDisplay={uiStageDisplay} 
                                uiStage={suite.stage as any || "draft"}
                                language={suite.language || "en"}
                            />
                        </div>

                        {suite.description && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Purpose</h3>
                                <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {suite.description}
                                </p>
                            </div>
                        )}

                        {tags.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Tags</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {tags.map(t => (
                                        <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-100 flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6">Protocol Requirements</h3>
                            
                            {protocols.length === 0 ? (
                                <p className="text-[15px] text-gray-500 italic">No explicit protocol bindings.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {protocols.map((p, idx) => (
                                        <li key={p.lineageId || idx} className="flex gap-4">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                                                    {idx + 1}
                                                </div>
                                                {idx < protocols.length - 1 && (
                                                    <div className="w-px h-full bg-blue-50 mt-1 mb-1" />
                                                )}
                                            </div>
                                            <div className="pb-4 flex-1">
                                                <div className="font-semibold text-gray-900 text-[15px] mb-1 leading-tight">{p.title || p.slug}</div>
                                                <div className="text-sm text-gray-600 leading-relaxed max-w-none prose prose-blue prose-sm text-opacity-90">
                                                    {p.summary || "No summary provided."}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
