import { useEffect, useState } from "react";
import { useRepo } from "@/domain/repo";
import type { SectionId, Need, Suite, Protocol } from "@/domain/types";
import { Routes, Route, useNavigate, useLocation, useParams, Link, Outlet } from "react-router-dom";
import { ProtocolProfile } from "@/features/protocols/components/ProtocolProfile";
import { SuiteProfile } from "@/features/suites/SuiteProfile";
import { NeedProfile } from "@/features/needs/components/NeedProfile";

export function SectionPage({ section }: { section: SectionId }) {
    return (
        <Routes>
            <Route element={<LayoutShell section={section} />}>
                <Route index element={<SectionIndex section={section} />} />
                <Route path="suites/:suiteId" element={<SuiteDetailWrapper />} />
                <Route path="suites/:suiteId/protocols" element={<ProtocolSelectPrompt />} />
                <Route path="suites/:suiteId/protocols/:protocolId/*" element={<ProtocolDetailWrapper />} />
                
                {/* Fallbacks directly to protocol outside of suite context if needed */}
                <Route path="protocols/:protocolId/*" element={<ProtocolDetailWrapper />} />
                
                {/* Nested Needs profile */}
                <Route path="needs/:rootId/*" element={<NeedDetailWrapper />} />
            </Route>
        </Routes>
    );
}

function LayoutShell({ section }: { section: SectionId }) {
    const location = useLocation();
    
    // Parse nested route from location to determine layout context
    const matchSuite = location.pathname.match(/\/suites\/([^/]+)/);
    const suiteId = matchSuite ? matchSuite[1] : null;

    const matchProtocol = location.pathname.match(/\/protocols\/([^/]+)/);
    const protocolId = matchProtocol ? matchProtocol[1] : null;

    const matchNeed = location.pathname.match(/\/needs\/([^/]+)/);
    const needId = matchNeed ? matchNeed[1] : null;

    return (
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-white">
            {/* Left Context Index (Sidebar) */}
            <div className="w-[300px] xl:w-[350px] border-r border-gray-100 overflow-y-auto hidden md:block bg-gray-50/40">
                <ContextSidebar 
                    section={section} 
                    suiteId={suiteId} 
                    protocolId={protocolId} 
                    needId={needId} 
                />
            </div>

            {/* Right Detail Panel */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 lg:pl-8">
                <Outlet />
            </div>
        </div>
    );
}

function ContextSidebar({ section, suiteId, protocolId, needId }: { section: SectionId, suiteId: string | null, protocolId: string | null, needId: string | null }) {
    const repo = useRepo();
    const [suites, setSuites] = useState<Suite[]>([]);
    const [protocols, setProtocols] = useState<Protocol[]>([]);
    const [subNeeds, setSubNeeds] = useState<Need[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const rootNeeds = await repo.getNeedsBySection(section);
            
            const allSuites: Suite[] = [];
            const allSubNeeds: Need[] = [];
            
            for (const n of rootNeeds) {
                // Fetch Suites
                const needSuites = await repo.getSuitesForNeed(n.rootId);
                allSuites.push(...needSuites);
                
                // Fetch Sub-needs
                for (const childId of n.childRootIds) {
                    const child = await repo.getNeedByRootId(childId);
                    if (child) allSubNeeds.push(child);
                }
            }
            
            // Deduplicate suites
            const uniqueSuites = Array.from(new Map(allSuites.map(s => [s.rootId, s])).values());
            
            // Fetch Protocols
            const allProtocols: Protocol[] = [];
            for (const s of uniqueSuites) {
                const suiteProtos = await repo.getSuiteProtocols(s.rootId);
                allProtocols.push(...suiteProtos);
            }
            
            // Deduplicate protocols
            const uniqueProtocols = Array.from(new Map(allProtocols.map(p => [p.id, p])).values());

            if (mounted) {
                setSuites(uniqueSuites);
                setProtocols(uniqueProtocols);
                setSubNeeds(allSubNeeds);
            }
        })();
        return () => { mounted = false; };
    }, [repo, section]);

    // Tailwind details styles for accordions
    const detailsSummaryClass = "px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 transition-colors select-none group-open:mb-2 focus:outline-none list-none [&::-webkit-details-marker]:hidden";

    return (
        <div className="flex flex-col h-full py-2">
            <div className="flex-1 overflow-y-auto space-y-2">
                
                {/* Suites Accordion */}
                <details className="group" open={!needId && !protocolId}>
                    <summary className={detailsSummaryClass}>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            Suites
                        </span>
                    </summary>
                    <div className="px-3 pb-2 space-y-1">
                        {suites.map(s => {
                            const sId = s.rootId;
                            const isActive = suiteId === sId && !protocolId;
                            return (
                                <Link 
                                    key={sId} 
                                    to={`/${section}/suites/${sId}`}
                                    className={`block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`}
                                >
                                    {s.title}
                                </Link>
                            );
                        })}
                    </div>
                </details>

                {/* Protocols Accordion */}
                <details className="group" open={!!protocolId}>
                    <summary className={detailsSummaryClass}>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            Protocols
                        </span>
                    </summary>
                    <div className="px-3 pb-2 space-y-1">
                        {protocols.length > 0 ? protocols.map(p => {
                            const slug = encodeURIComponent(p.id);
                            const isActive = protocolId === slug;
                            // Prepend the suiteId context to the URL if we have one active, otherwise just use /protocols
                            const targetUrl = suiteId ? `/${section}/suites/${suiteId}/protocols/${slug}` : `/${section}/protocols/${slug}`;
                            return (
                                <Link 
                                    key={p.id} 
                                    to={targetUrl}
                                    className={`block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`}
                                >
                                    {p.title}
                                </Link>
                            );
                        }) : (
                            <div className="pl-6 pr-3 py-2 text-sm text-gray-500">No protocols found.</div>
                        )}
                    </div>
                </details>

                {/* Sub-needs Accordion */}
                {subNeeds.length > 0 && (
                    <details className="group" open={!!needId}>
                        <summary className={detailsSummaryClass}>
                            <span className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                Sub-Needs
                            </span>
                        </summary>
                        <div className="px-3 pb-2 space-y-1">
                            {subNeeds.map(n => {
                                const isActive = needId === n.rootId;
                                return (
                                    <Link 
                                        key={n.rootId} 
                                        to={`/${section}/needs/${n.rootId}`}
                                        className={`block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`}
                                    >
                                        {n.title}
                                    </Link>
                                );
                            })}
                        </div>
                    </details>
                )}

            </div>
        </div>
    );
}

function SectionIndex({ section }: { section: SectionId }) {
    const repo = useRepo();
    const [intro, setIntro] = useState("");
    
    useEffect(() => {
        let mounted = true;
        (async () => {
            const sections = await repo.listSections();
            const current = sections.find((s) => s.id === section);
            if (mounted) setIntro(current?.intro ?? "");
        })();
        return () => { mounted = false; };
    }, [repo, section]);

    return (
        <div className="max-w-2xl mt-4 animate-fade-in-up">
            <h1 className="text-3xl font-semibold capitalize mb-4 tracking-tight">{section}</h1>
            {intro && <p className="text-lg text-gray-600 mb-8 leading-relaxed">{intro}</p>}
            
            <div className="p-6 rounded-2xl border bg-gray-50/50 border-dashed border-gray-200">
                <p className="text-gray-500 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Select an item from the left sidebar to view its details.
                </p>
            </div>
        </div>
    );
}

function ProtocolSelectPrompt() {
    return (
        <div className="max-w-2xl mt-4 animate-fade-in-up">
            <div className="p-6 rounded-2xl border bg-gray-50/50 border-dashed border-gray-200">
                <p className="text-gray-500 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Select a protocol from the left sidebar to read or edit.
                </p>
            </div>
        </div>
    );
}

function SuiteDetailWrapper() {
    const { suiteId } = useParams();
    if (!suiteId) return null;
    return <SuiteProfile suiteId={suiteId} />;
}

function ProtocolDetailWrapper() {
    const { protocolId } = useParams();
    if (!protocolId) return null;
    // ProtocolProfile will automatically unpack from URL params if prop isn't passed, but let's be explicit
    return <ProtocolProfile protocolId={protocolId} />;
}

function NeedDetailWrapper() {
    return <NeedProfile />;
}