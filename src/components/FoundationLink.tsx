import { useEffect, useState } from "react";
import { useRepo } from "@/domain/repo";
import type { StrongRef } from "@/domain/types";
import { Compass } from "lucide-react";
import { SuiteDrawer } from "./SuiteDrawer";

export function FoundationLink({ foundationRef }: { foundationRef?: StrongRef }) {
    const repo = useRepo();
    const [title, setTitle] = useState<string>("Loading Foundation...");
    const [slug, setSlug] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        if (!foundationRef?.uri) {
            setTitle("Unknown Foundation");
            return;
        }

        let alive = true;
        (async () => {
            try {
                const rawUri = foundationRef.uri;
                let cleanId = rawUri;
                if (rawUri.includes("/")) cleanId = rawUri.split("/").pop() || rawUri;
                
                let suite = null;
                if (!suite) {
                     suite = await repo.getSuite(cleanId);
                }
                
                if (alive) {
                    if (suite) {
                         setTitle(suite.title || "Core Proto-Protocols Suite");
                         setSlug(suite.slug || cleanId);
                    } else {
                         // Fallback for mocks missing specific fetch bridges
                         if (cleanId === "suite-root-protocols" || rawUri.includes("suite-root-protocols")) {
                             setTitle("Core Proto-Protocols Suite");
                             setSlug("suite-root-protocols");
                         } else {
                             setTitle("Archived Foundation");
                         }
                    }
                }
            } catch (e) {
                if (alive) setTitle("Archived Foundation");
            }
        })();
        return () => { alive = false; };
    }, [foundationRef, repo]);

    if (!foundationRef) return null;

    return (
        <>
            <div className="flex items-center gap-2 mt-5 mb-4 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/60 text-[15px] text-indigo-900 shadow-sm w-full transition-all hover:bg-indigo-50 max-w-none">
                <Compass className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="text-indigo-700/80 mr-1 italic font-medium">Grounding Protocols:</span> 
                {slug ? (
                    <button type="button" onClick={() => setIsDrawerOpen(true)} className="font-semibold hover:underline hover:text-indigo-700 underline-offset-2">
                        {title}
                    </button>
                ) : (
                    <span className="font-semibold">{title}</span>
                )}
            </div>
            <SuiteDrawer 
                suiteId={slug || foundationRef.uri} 
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
            />
        </>
    );
}
