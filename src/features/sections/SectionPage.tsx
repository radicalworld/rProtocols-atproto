import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useRepo } from "@/domain/repo";
import { useSession } from "@/features/auth/SessionProvider";
import type { SectionId, Need, Suite, Protocol } from "@/domain/types";
import { Routes, Route, useNavigate, useLocation, useParams, Link, Outlet } from "react-router-dom";
import { ProtocolProfile } from "@/features/protocols/components/ProtocolProfile";
import { SuiteProfile } from "@/features/suites/SuiteProfile";
import { NeedProfile } from "@/features/needs/components/NeedProfile";
import ProtocolEditorProfile from "@/features/protocols/components/ProtocolEditorProfile";
import NeedEditorProfile from "@/features/needs/components/NeedEditorProfile";
import SuiteEditorProfile from "@/features/suites/SuiteEditorProfile";
import { SuiteIcon } from "@/components/icons/SuiteIcon";
import { ProtocolIcon } from "@/components/icons/ProtocolIcon";
import { NeedIcon } from "@/components/icons/NeedIcon";

export function SectionPage({ section }: { section: SectionId }) {
    const nav = useNavigate();
    return (
        <Routes>
            <Route element={<LayoutShell section={section} />}>
                <Route index element={<SectionIndex section={section} />} />
                
                <Route path="suites/new" element={
                    <div className="mx-auto max-w-[1200px] mt-6 lg:mt-0 lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8">
                        <SuiteEditorProfile isNew={true} parentNeedId={section} onClose={(newId) => { 
                            if (newId) {
                                // Important: We MUST use the React Router to avoid wiping the transient Mock memory objects out on page reload
                                nav(`/${section}/suites/${newId}`);
                            }
                            else nav("..");
                        }} />
                        <aside className="hidden lg:block space-y-6 pt-6">
                            <div className="rounded-2xl border bg-gray-50/80 p-5 shadow-sm lg:sticky lg:top-0">
                                <h2 className="mb-4 font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3">
                                    Suite Details
                                </h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Release</h3>
                                            <p className="text-sm text-gray-900 leading-relaxed">v0.1.0 &middot; en</p>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Signals</h3>
                                            <p className="text-sm text-gray-900 leading-relaxed">
                                                Follows: 0<span className="block text-gray-900 mt-0.5">Adopts: 0</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                } />
                <Route path="protocols/new" element={
                    <div className="mx-auto max-w-[1200px] lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8">
                        <ProtocolEditorProfile isNew={true} parentNeedId={section} />
                        <aside className="hidden lg:block space-y-6">
                            <div className="rounded-2xl border bg-gray-50/80 p-5 shadow-sm border-dashed border-gray-200">
                                <p className="text-gray-500 mb-2 font-medium">Genesis Record</p>
                                <p className="text-sm text-gray-500">You are authoring a new root atomic graph node. Metadata analytics will unlock upon successful PDS network broadcast.</p>
                            </div>
                        </aside>
                    </div>
                } />
                <Route path="needs/new" element={
                    <div className="mx-auto max-w-[1200px] lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8">
                        <NeedEditorProfile isNew={true} parentLineageId={section} />
                        <aside className="hidden lg:block space-y-6">
                            <div className="rounded-2xl border bg-gray-50/80 p-5 shadow-sm border-dashed border-gray-200">
                                <p className="text-gray-500 mb-2 font-medium">Genesis Record</p>
                                <p className="text-sm text-gray-500">You are authoring a new root atomic graph node. Metadata analytics will unlock upon successful PDS network broadcast.</p>
                            </div>
                        </aside>
                    </div>
                } />
                <Route path="suites/:suiteId/protocols/new" element={
                    <div className="mx-auto max-w-[1200px] lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8">
                        <ProtocolEditorProfile isNew={true} parentNeedId={section} />
                        <aside className="hidden lg:block space-y-6">
                            <div className="rounded-2xl border bg-gray-50/80 p-5 shadow-sm border-dashed border-gray-200">
                                <p className="text-gray-500 mb-2 font-medium">Genesis Record</p>
                                <p className="text-sm text-gray-500">You are authoring a new root atomic graph node. Metadata analytics will unlock upon successful PDS network broadcast.</p>
                            </div>
                        </aside>
                    </div>
                } />
                {/* Suites explicitly matching explicit versions */}
                <Route path="suites/:suiteId/versions/:version" element={<SuiteDetailWrapper />} />
                <Route path="suites/:suiteId/*" element={<SuiteDetailWrapper />} />
                
                <Route path="suites/:suiteId/protocols" element={<ProtocolSelectPrompt />} />
                
                {/* Protocols nested in suites catching versions natively */}
                <Route path="suites/:suiteId/protocols/:protocolId/versions/:version" element={<ProtocolDetailWrapper />} />
                <Route path="suites/:suiteId/protocols/:protocolId/*" element={<ProtocolDetailWrapper />} />
                
                {/* Fallbacks directly to protocol outside of suite context if needed */}
                <Route path="protocols/:protocolId/versions/:version" element={<ProtocolDetailWrapper />} />
                <Route path="protocols/:protocolId/*" element={<ProtocolDetailWrapper />} />
                
                {/* Nested Needs profile */}
                <Route path="needs/:rootId/v/:version" element={<NeedDetailWrapper />} />
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

function CountBubble({ count }: { count: number }) {
    return (
        <span className="ml-1 inline-flex items-center justify-center bg-gray-100 text-gray-500 rounded-full px-1.5 min-w-[20px] h-[20px] text-[10px] font-bold tracking-normal">
            {count}
        </span>
    );
}

function ContextSidebar({ section, suiteId, protocolId, needId }: { section: SectionId, suiteId: string | null, protocolId: string | null, needId: string | null }) {
    const repo = useRepo();
    const nav = useNavigate();
    const { session } = useSession();
    const [suites, setSuites] = useState<Suite[]>([]);
    const [protocols, setProtocols] = useState<Protocol[]>([]);
    const [subNeeds, setSubNeeds] = useState<Need[]>([]);
    const [rootNeed, setRootNeed] = useState<Need | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const rootNeeds = await repo.getNeedsBySection(section);
            
            const allSuites: Suite[] = [];
            const allSubNeeds: Need[] = [];
            const allProtocols: Protocol[] = [];
            
            for (const n of rootNeeds) {
                // Fetch Suites
                const needSuites = await repo.getSuitesForNeed(n.lineageId);
                allSuites.push(...needSuites);
                
                // Fetch Sub-needs
                for (const childId of n.childLineageIds) {
                    const child = await repo.getNeedByLineageId(childId);
                    if (child) allSubNeeds.push(child);
                }
                
                // Fetch Protocols mapped directly to the Root Need
                if (repo.getProtocolsForNeed) {
                    const needProtos = await repo.getProtocolsForNeed(n.lineageId);
                    allProtocols.push(...needProtos);
                }
            }
            
            // Deduplicate suites
            const uniqueSuites = Array.from(new Map(allSuites.map(s => [s.lineageId, s])).values());
            
            // Fetch Protocols grouped inside Suites (and merge them into our list)
            for (const s of uniqueSuites) {
                const suiteProtos = await repo.getSuiteProtocols(s.lineageId);
                allProtocols.push(...suiteProtos);
            }
            
            // Deduplicate protocols
            const uniqueProtocols = Array.from(new Map(allProtocols.map(p => [p.id, p])).values());

            const rNeed = await repo.getNeedByLineageId(section);

            if (mounted) {
                setSuites(uniqueSuites);
                setProtocols(uniqueProtocols);
                setSubNeeds(allSubNeeds);
                if (rNeed) setRootNeed(rNeed);
            }
        })();
        return () => { mounted = false; };
    }, [repo, section, suiteId, protocolId, needId]);

    // Tailwind details styles for accordions
    const detailsSummaryClass = "px-5 py-3 text-[11px] font-semibold text-gray-500 hover:text-gray-900 uppercase tracking-wider cursor-pointer transition-colors select-none group-open:mb-2 focus:outline-none list-none [&::-webkit-details-marker]:hidden flex items-center justify-between";

    return (
        <div className="flex flex-col h-full py-2">
            {rootNeed && (
                <div className="px-5 py-4 mb-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <NeedIcon className="w-5 h-5 text-gray-900" />
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                            {rootNeed.title}
                        </h2>
                    </div>
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto space-y-2">
                
                {/* Suites Accordion */}
                <details className="group" open={!needId && !protocolId}>
                    <summary className={detailsSummaryClass}>
                        <span className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-50 shadow-sm flex items-center justify-center text-gray-500 group-hover:text-gray-900 group-hover:border-gray-300 transition-colors">
                                <SuiteIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-gray-700">Suites</span> <CountBubble count={suites.length} />
                        </span>
                        {session && (
                        <button 
                            onClick={(e) => { e.preventDefault(); nav(`/${section}/suites/new`); }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-900 transition-colors"
                            title="Add Suite"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        )}
                    </summary>
                    <div className="ml-9 pl-3 pr-3 pb-2 space-y-1 border-l border-gray-100">
                        {suiteId === "new" && (
                            <div className="block pl-3 pr-3 py-2.5 rounded-lg text-sm transition-colors bg-white text-blue-700 font-medium shadow-sm border border-gray-100">
                                New Suite...
                            </div>
                        )}
                        {suites.length > 0 ? suites.map(s => {
                            const sId = s.lineageId;
                            const isActive = suiteId === sId && !protocolId;
                            return (
                                <Link 
                                    key={sId} 
                                    to={`/${section}/suites/${sId}`}
                                    className={`flex items-center gap-2 pl-3 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`}
                                >
                                    <SuiteIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    <span className="truncate">{s.title}</span>
                                </Link>
                            );
                        }) : (
                            <div className="pl-6 pr-3 py-2 text-sm text-gray-500">No suites found.</div>
                        )}
                    </div>
                </details>

                {/* Protocols Accordion */}
                <details className="group" open={!!protocolId}>
                    <summary className={detailsSummaryClass}>
                        <span className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-50 shadow-sm flex items-center justify-center text-gray-500 group-hover:text-gray-900 group-hover:border-gray-300 transition-colors">
                                <ProtocolIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-gray-700">Protocols</span> <CountBubble count={protocols.length} />
                        </span>
                        {session && (
                        <button 
                            onClick={(e) => { e.preventDefault(); nav(`/${section}/protocols/new`); }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-900 transition-colors"
                            title="Add Protocol"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        )}
                    </summary>
                    <div className="ml-9 pl-3 pr-3 pb-2 space-y-1 border-l border-gray-100">
                        {protocolId === "new" && (
                            <div className="block pl-3 pr-3 py-2.5 rounded-lg text-sm transition-colors bg-white text-blue-700 font-medium shadow-sm border border-gray-100">
                                New Protocol...
                            </div>
                        )}
                        {protocols.length > 0 ? protocols.map(p => {
                            const slug = encodeURIComponent(p.id);
                            const isActive = protocolId === slug;
                            // Prepend the suiteId context to the URL if we have one active, otherwise just use /protocols
                            const targetUrl = suiteId ? `/${section}/suites/${suiteId}/protocols/${slug}` : `/${section}/protocols/${slug}`;
                            return (
                                <Link 
                                    key={p.id} 
                                    to={targetUrl}
                                    className={`flex items-center gap-2 pl-3 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`}
                                >
                                    <ProtocolIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    <span className="truncate">{p.title}</span>
                                </Link>
                            );
                        }) : (
                            <div className="pl-6 pr-3 py-2 text-sm text-gray-500">No protocols found.</div>
                        )}
                    </div>
                </details>

                {/* Sub-needs Accordion */}
                <details className="group" open={!!needId}>
                    <summary className={detailsSummaryClass}>
                        <span className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-50 shadow-sm flex items-center justify-center text-gray-500 group-hover:text-gray-900 group-hover:border-gray-300 transition-colors">
                                <NeedIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-gray-700">Sub-Needs</span> <CountBubble count={subNeeds.length} />
                        </span>
                        {session && (
                        <button 
                            onClick={(e) => { e.preventDefault(); nav(`/${section}/needs/new`); }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-900 transition-colors"
                            title="Add Sub-Need"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        )}
                    </summary>
                    <div className="ml-9 pl-3 pr-3 pb-2 space-y-1 border-l border-gray-100">
                        {needId === "new" && (
                            <div className="block pl-3 pr-3 py-2.5 rounded-lg text-sm transition-colors bg-white text-blue-700 font-medium shadow-sm border border-gray-100">
                                New Sub-Need...
                            </div>
                        )}
                        {subNeeds.length > 0 ? subNeeds.map(n => {
                            const isActive = needId === n.lineageId;
                            return (
                                <Link 
                                    key={n.lineageId} 
                                    to={`/${section}/needs/${n.lineageId}`}
                                    className={`flex items-center gap-2 pl-3 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`}
                                >
                                    <NeedIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    <span className="truncate">{n.title}</span>
                                </Link>
                            );
                        }) : (
                            <div className="pl-6 pr-3 py-2 text-sm text-gray-500">No sub-needs found.</div>
                        )}
                    </div>
                </details>

            </div>
        </div>
    );
}

function SectionIndex({ section }: { section: SectionId }) {
    const repo = useRepo();
    const nav = useNavigate();
    const [intro, setIntro] = useState("");
    const [isChecking, setIsChecking] = useState(true);
    
    useEffect(() => {
        let mounted = true;
        (async () => {
            const sections = await repo.listSections();
            const current = sections.find((s) => s.id === section);
            
            // Auto-select the first available Suite natively
            const rootNeeds = await repo.getNeedsBySection(section);
            let firstSuiteId: string | null = null;
            let firstSubNeedId: string | null = null;

            for (const n of rootNeeds) {
                const needSuites = await repo.getSuitesForNeed(n.lineageId);
                if (needSuites.length > 0 && !firstSuiteId) {
                    firstSuiteId = needSuites[0].lineageId;
                }
                if (!firstSuiteId && n.childLineageIds.length > 0 && !firstSubNeedId) {
                    firstSubNeedId = n.childLineageIds[0];
                }
            }

            if (mounted) {
                if (firstSuiteId) {
                    nav(`/${section}/suites/${firstSuiteId}`, { replace: true });
                } else if (firstSubNeedId) {
                    nav(`/${section}/needs/${firstSubNeedId}`, { replace: true });
                } else {
                    setIntro(current?.intro ?? "");
                    setIsChecking(false);
                }
            }
        })();
        return () => { mounted = false; };
    }, [repo, section, nav]);

    if (isChecking) return null;

    return (
        <div className="max-w-2xl mt-4 animate-fade-in-up">
            <h1 className="text-3xl font-semibold capitalize mb-4 tracking-tight">{section}</h1>
            {intro && <p className="text-lg text-gray-600 mb-8 leading-relaxed">{intro}</p>}
            
            <div className="p-6 rounded-2xl border bg-gray-50/50 border-dashed border-gray-200">
                <p className="text-gray-500 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Start by clicking the '+' buttons on the sidebar to create new items.
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