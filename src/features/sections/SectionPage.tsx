import { useEffect, useState } from "react";
import { useRepo } from "@/domain/repo";
import type { SectionId, Need } from "@/domain/types";
import { NeedCard } from "@/features/needs/NeedCard";

import { Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { ProtocolProfile } from "@/features/protocols/components/ProtocolProfile";

export function SectionPage({ section }: { section: SectionId }) {
    const repo = useRepo();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Parse nested route from location to determine layout state
    const pathParts = location.pathname.split("/").filter(Boolean);
    const isDetailView = pathParts.includes("protocols"); // e.g. /collaboration/protocols/Bar OR /collaboration/suites/Foo/protocols/Bar

    const [intro, setIntro] = useState("");
    const [needs, setNeeds] = useState<Need[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const sections = await repo.listSections();
            const current = sections.find((s) => s.id === section);
            if (mounted) setIntro(current?.intro ?? "");
            const list = await repo.getNeedsBySection(section);
            if (mounted) setNeeds(list);
        })();
        return () => { mounted = false; };
    }, [repo, section]);

    console.log("NEEDS", needs)

    return (
        <div className="w-full px-4 lg:px-6">
            <h1 className="text-2xl font-semibold capitalize mb-6">{section}</h1>
            {intro && <p className="text-gray-600 mb-6">{intro}</p>}

            <div className={`flex gap-6 items-start transition-all duration-300`}>
                {/* Left Side: Needs List Master View */}
                <div className={`flex-shrink-0 space-y-4 transition-all duration-300 ${isDetailView ? 'w-[400px] xl:w-[450px]' : 'w-full'}`}>
                    {needs.map((n) => (
                        <NeedCard 
                            key={n.rootId} 
                            needId={n.rootId} 
                        />
                    ))}
                </div>

                {/* Right Side: Detail Viewer Container */}
                {isDetailView && (
                    <div className="flex-1 min-w-0 rounded-2xl border bg-white p-6 shadow-sm sticky top-6 animate-fade-in-right">
                        <button 
                            onClick={() => navigate(`/${section}`)} 
                            className="mb-4 text-sm text-gray-500 hover:text-black flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to full view
                        </button>
                        
                        {/* Nested Routes for the Right Hand Detail Pane */}
                        <Routes>
                            <Route path="protocols/:slug/*" element={<ProtocolDetailWrapper />} />
                        </Routes>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper wrapper to read slug
function ProtocolDetailWrapper() {
    const { slug } = useParams();
    if (!slug) return <div className="text-gray-500 mt-10 text-center">Protocol not found.</div>;
    return <ProtocolProfile protocolId={slug} />;
}