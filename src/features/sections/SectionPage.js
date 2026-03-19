import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useRepo } from "@/domain/repo";
import { useSession } from "@/features/auth/SessionProvider";
import { Routes, Route, useNavigate, useLocation, useParams, Link, Outlet } from "react-router-dom";
import { ProtocolProfile } from "@/features/protocols/components/ProtocolProfile";
import { SuiteProfile } from "@/features/suites/SuiteProfile";
import { NeedProfile } from "@/features/needs/components/NeedProfile";
import ProtocolEditorProfile from "@/features/protocols/components/ProtocolEditorProfile";
import NeedEditorProfile from "@/features/needs/components/NeedEditorProfile";
import SuiteEditorProfile from "@/features/suites/SuiteEditorProfile";
export function SectionPage({ section }) {
    const nav = useNavigate();
    return (_jsx(Routes, { children: _jsxs(Route, { element: _jsx(LayoutShell, { section: section }), children: [_jsx(Route, { index: true, element: _jsx(SectionIndex, { section: section }) }), _jsx(Route, { path: "suites/new", element: _jsxs("div", { className: "mx-auto max-w-[1200px] mt-6 lg:mt-0 lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8", children: [_jsx(SuiteEditorProfile, { isNew: true, parentNeedId: section, onClose: (newId) => {
                                    if (newId) {
                                        // Important: We MUST use the React Router to avoid wiping the transient Mock memory objects out on page reload
                                        nav(`/${section}/suites/${newId}`);
                                    }
                                    else
                                        nav("..");
                                } }), _jsx("aside", { className: "hidden lg:block space-y-6 pt-6", children: _jsxs("div", { className: "rounded-2xl border bg-gray-50/80 p-5 shadow-sm lg:sticky lg:top-0", children: [_jsx("h2", { className: "mb-4 font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3", children: "Suite Details" }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1", children: "Release" }), _jsx("p", { className: "text-sm text-gray-900 leading-relaxed", children: "v0.1.0 \u00B7 en" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1", children: "Signals" }), _jsxs("p", { className: "text-sm text-gray-900 leading-relaxed", children: ["Follows: 0", _jsx("span", { className: "block text-gray-900 mt-0.5", children: "Adopts: 0" })] })] })] }) })] }) })] }) }), _jsx(Route, { path: "protocols/new", element: _jsxs("div", { className: "mx-auto max-w-[1200px] lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8", children: [_jsx(ProtocolEditorProfile, { isNew: true, parentNeedId: section }), _jsx("aside", { className: "hidden lg:block space-y-6", children: _jsxs("div", { className: "rounded-2xl border bg-gray-50/80 p-5 shadow-sm border-dashed border-gray-200", children: [_jsx("p", { className: "text-gray-500 mb-2 font-medium", children: "Genesis Record" }), _jsx("p", { className: "text-sm text-gray-500", children: "You are authoring a new root atomic graph node. Metadata analytics will unlock upon successful PDS network broadcast." })] }) })] }) }), _jsx(Route, { path: "needs/new", element: _jsx(NeedEditorProfile, { isNew: true, parentLineageId: section }) }), _jsx(Route, { path: "suites/:suiteId/protocols/new", element: _jsxs("div", { className: "mx-auto max-w-[1200px] lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8", children: [_jsx(ProtocolEditorProfile, { isNew: true, parentNeedId: section }), _jsx("aside", { className: "hidden lg:block space-y-6", children: _jsxs("div", { className: "rounded-2xl border bg-gray-50/80 p-5 shadow-sm border-dashed border-gray-200", children: [_jsx("p", { className: "text-gray-500 mb-2 font-medium", children: "Genesis Record" }), _jsx("p", { className: "text-sm text-gray-500", children: "You are authoring a new root atomic graph node. Metadata analytics will unlock upon successful PDS network broadcast." })] }) })] }) }), _jsx(Route, { path: "suites/:suiteId/*", element: _jsx(SuiteDetailWrapper, {}) }), _jsx(Route, { path: "suites/:suiteId/protocols", element: _jsx(ProtocolSelectPrompt, {}) }), _jsx(Route, { path: "suites/:suiteId/protocols/:protocolId/*", element: _jsx(ProtocolDetailWrapper, {}) }), _jsx(Route, { path: "protocols/:protocolId/*", element: _jsx(ProtocolDetailWrapper, {}) }), _jsx(Route, { path: "needs/:rootId/*", element: _jsx(NeedDetailWrapper, {}) })] }) }));
}
function LayoutShell({ section }) {
    const location = useLocation();
    // Parse nested route from location to determine layout context
    const matchSuite = location.pathname.match(/\/suites\/([^/]+)/);
    const suiteId = matchSuite ? matchSuite[1] : null;
    const matchProtocol = location.pathname.match(/\/protocols\/([^/]+)/);
    const protocolId = matchProtocol ? matchProtocol[1] : null;
    const matchNeed = location.pathname.match(/\/needs\/([^/]+)/);
    const needId = matchNeed ? matchNeed[1] : null;
    return (_jsxs("div", { className: "flex h-[calc(100vh-64px)] w-full overflow-hidden bg-white", children: [_jsx("div", { className: "w-[300px] xl:w-[350px] border-r border-gray-100 overflow-y-auto hidden md:block bg-gray-50/40", children: _jsx(ContextSidebar, { section: section, suiteId: suiteId, protocolId: protocolId, needId: needId }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-4 lg:p-6 lg:pl-8", children: _jsx(Outlet, {}) })] }));
}
function CountBubble({ count }) {
    return (_jsx("span", { className: "ml-1 inline-flex items-center justify-center bg-gray-100 text-gray-500 rounded-full px-1.5 min-w-[20px] h-[20px] text-[10px] font-bold tracking-normal", children: count }));
}
function ContextSidebar({ section, suiteId, protocolId, needId }) {
    const repo = useRepo();
    const nav = useNavigate();
    const { session } = useSession();
    const [suites, setSuites] = useState([]);
    const [protocols, setProtocols] = useState([]);
    const [subNeeds, setSubNeeds] = useState([]);
    const [rootNeed, setRootNeed] = useState(null);
    useEffect(() => {
        let mounted = true;
        (async () => {
            const rootNeeds = await repo.getNeedsBySection(section);
            const allSuites = [];
            const allSubNeeds = [];
            const allProtocols = [];
            for (const n of rootNeeds) {
                // Fetch Suites
                const needSuites = await repo.getSuitesForNeed(n.lineageId);
                allSuites.push(...needSuites);
                // Fetch Sub-needs
                for (const childId of n.childLineageIds) {
                    const child = await repo.getNeedByLineageId(childId);
                    if (child)
                        allSubNeeds.push(child);
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
                if (rNeed)
                    setRootNeed(rNeed);
            }
        })();
        return () => { mounted = false; };
    }, [repo, section, suiteId, protocolId, needId]);
    // Tailwind details styles for accordions
    const detailsSummaryClass = "px-5 py-3 text-[11px] font-semibold text-gray-500 hover:text-gray-900 uppercase tracking-wider cursor-pointer transition-colors select-none group-open:mb-2 focus:outline-none list-none [&::-webkit-details-marker]:hidden flex items-center justify-between";
    return (_jsxs("div", { className: "flex flex-col h-full py-2", children: [rootNeed && (_jsx("div", { className: "px-5 py-4 mb-2 border-b border-gray-100 flex items-center justify-between", children: _jsx("h2", { className: "text-sm font-bold text-gray-900 uppercase tracking-wider", children: rootNeed.title }) })), _jsxs("div", { className: "flex-1 overflow-y-auto space-y-2", children: [_jsxs("details", { className: "group", open: !needId && !protocolId, children: [_jsxs("summary", { className: detailsSummaryClass, children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("svg", { className: "w-3.5 h-3.5 transition-transform group-open:rotate-90", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }), "Suites ", _jsx(CountBubble, { count: suites.length })] }), session && (_jsx("button", { onClick: (e) => { e.preventDefault(); nav(`/${section}/suites/new`); }, className: "p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-900 transition-colors", title: "Add Suite", children: _jsx(Plus, { className: "w-3.5 h-3.5" }) }))] }), _jsxs("div", { className: "px-3 pb-2 space-y-1", children: [suiteId === "new" && (_jsx("div", { className: "block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors bg-white text-blue-700 font-medium shadow-sm border border-gray-100", children: "New Suite..." })), suites.length > 0 ? suites.map(s => {
                                        const sId = s.lineageId;
                                        const isActive = suiteId === sId && !protocolId;
                                        return (_jsx(Link, { to: `/${section}/suites/${sId}`, className: `block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`, children: s.title }, sId));
                                    }) : (_jsx("div", { className: "pl-6 pr-3 py-2 text-sm text-gray-500", children: "No suites found." }))] })] }), _jsxs("details", { className: "group", open: !!protocolId, children: [_jsxs("summary", { className: detailsSummaryClass, children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("svg", { className: "w-3.5 h-3.5 transition-transform group-open:rotate-90", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }), "Protocols ", _jsx(CountBubble, { count: protocols.length })] }), session && (_jsx("button", { onClick: (e) => { e.preventDefault(); nav(`/${section}/protocols/new`); }, className: "p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-900 transition-colors", title: "Add Protocol", children: _jsx(Plus, { className: "w-3.5 h-3.5" }) }))] }), _jsxs("div", { className: "px-3 pb-2 space-y-1", children: [protocolId === "new" && (_jsx("div", { className: "block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors bg-white text-blue-700 font-medium shadow-sm border border-gray-100", children: "New Protocol..." })), protocols.length > 0 ? protocols.map(p => {
                                        const slug = encodeURIComponent(p.id);
                                        const isActive = protocolId === slug;
                                        // Prepend the suiteId context to the URL if we have one active, otherwise just use /protocols
                                        const targetUrl = suiteId ? `/${section}/suites/${suiteId}/protocols/${slug}` : `/${section}/protocols/${slug}`;
                                        return (_jsx(Link, { to: targetUrl, className: `block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`, children: p.title }, p.id));
                                    }) : (_jsx("div", { className: "pl-6 pr-3 py-2 text-sm text-gray-500", children: "No protocols found." }))] })] }), _jsxs("details", { className: "group", open: !!needId, children: [_jsxs("summary", { className: detailsSummaryClass, children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("svg", { className: "w-3.5 h-3.5 transition-transform group-open:rotate-90", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }), "Sub-Needs ", _jsx(CountBubble, { count: subNeeds.length })] }), session && (_jsx("button", { onClick: (e) => { e.preventDefault(); nav(`/${section}/needs/new`); }, className: "p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-900 transition-colors", title: "Add Sub-Need", children: _jsx(Plus, { className: "w-3.5 h-3.5" }) }))] }), _jsxs("div", { className: "px-3 pb-2 space-y-1", children: [needId === "new" && (_jsx("div", { className: "block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors bg-white text-blue-700 font-medium shadow-sm border border-gray-100", children: "New Sub-Need..." })), subNeeds.length > 0 ? subNeeds.map(n => {
                                        const isActive = needId === n.lineageId;
                                        return (_jsx(Link, { to: `/${section}/needs/${n.lineageId}`, className: `block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`, children: n.title }, n.lineageId));
                                    }) : (_jsx("div", { className: "pl-6 pr-3 py-2 text-sm text-gray-500", children: "No sub-needs found." }))] })] })] })] }));
}
function SectionIndex({ section }) {
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
            let firstSuiteId = null;
            let firstSubNeedId = null;
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
                }
                else if (firstSubNeedId) {
                    nav(`/${section}/needs/${firstSubNeedId}`, { replace: true });
                }
                else {
                    setIntro(current?.intro ?? "");
                    setIsChecking(false);
                }
            }
        })();
        return () => { mounted = false; };
    }, [repo, section, nav]);
    if (isChecking)
        return null;
    return (_jsxs("div", { className: "max-w-2xl mt-4 animate-fade-in-up", children: [_jsx("h1", { className: "text-3xl font-semibold capitalize mb-4 tracking-tight", children: section }), intro && _jsx("p", { className: "text-lg text-gray-600 mb-8 leading-relaxed", children: intro }), _jsx("div", { className: "p-6 rounded-2xl border bg-gray-50/50 border-dashed border-gray-200", children: _jsxs("p", { className: "text-gray-500 flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5 text-gray-400 hidden md:block", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }), "Start by clicking the '+' buttons on the sidebar to create new items."] }) })] }));
}
function ProtocolSelectPrompt() {
    return (_jsx("div", { className: "max-w-2xl mt-4 animate-fade-in-up", children: _jsx("div", { className: "p-6 rounded-2xl border bg-gray-50/50 border-dashed border-gray-200", children: _jsxs("p", { className: "text-gray-500 flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5 text-gray-400 hidden md:block", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }), "Select a protocol from the left sidebar to read or edit."] }) }) }));
}
function SuiteDetailWrapper() {
    const { suiteId } = useParams();
    if (!suiteId)
        return null;
    return _jsx(SuiteProfile, { suiteId: suiteId });
}
function ProtocolDetailWrapper() {
    const { protocolId } = useParams();
    if (!protocolId)
        return null;
    // ProtocolProfile will automatically unpack from URL params if prop isn't passed, but let's be explicit
    return _jsx(ProtocolProfile, { protocolId: protocolId });
}
function NeedDetailWrapper() {
    return _jsx(NeedProfile, {});
}
