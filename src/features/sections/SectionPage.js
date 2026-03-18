import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useRepo } from "@/domain/repo";
import { Routes, Route, useLocation, useParams, Link, Outlet } from "react-router-dom";
import { ProtocolProfile } from "@/features/protocols/components/ProtocolProfile";
import { SuiteProfile } from "@/features/suites/SuiteProfile";
import { NeedProfile } from "@/features/needs/components/NeedProfile";
export function SectionPage({ section }) {
    return (_jsx(Routes, { children: _jsxs(Route, { element: _jsx(LayoutShell, { section: section }), children: [_jsx(Route, { index: true, element: _jsx(SectionIndex, { section: section }) }), _jsx(Route, { path: "suites/:suiteId", element: _jsx(SuiteDetailWrapper, {}) }), _jsx(Route, { path: "suites/:suiteId/protocols", element: _jsx(ProtocolSelectPrompt, {}) }), _jsx(Route, { path: "suites/:suiteId/protocols/:protocolId/*", element: _jsx(ProtocolDetailWrapper, {}) }), _jsx(Route, { path: "protocols/:protocolId/*", element: _jsx(ProtocolDetailWrapper, {}) }), _jsx(Route, { path: "needs/:rootId/*", element: _jsx(NeedDetailWrapper, {}) })] }) }));
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
function ContextSidebar({ section, suiteId, protocolId, needId }) {
    const repo = useRepo();
    const [suites, setSuites] = useState([]);
    const [protocols, setProtocols] = useState([]);
    const [subNeeds, setSubNeeds] = useState([]);
    useEffect(() => {
        let mounted = true;
        (async () => {
            const rootNeeds = await repo.getNeedsBySection(section);
            const allSuites = [];
            const allSubNeeds = [];
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
            }
            // Deduplicate suites
            const uniqueSuites = Array.from(new Map(allSuites.map(s => [s.lineageId, s])).values());
            // Fetch Protocols
            const allProtocols = [];
            for (const s of uniqueSuites) {
                const suiteProtos = await repo.getSuiteProtocols(s.lineageId);
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
    return (_jsx("div", { className: "flex flex-col h-full py-2", children: _jsxs("div", { className: "flex-1 overflow-y-auto space-y-2", children: [_jsxs("details", { className: "group", open: !needId && !protocolId, children: [_jsx("summary", { className: detailsSummaryClass, children: _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("svg", { className: "w-3.5 h-3.5 transition-transform group-open:rotate-90", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }), "Suites"] }) }), _jsx("div", { className: "px-3 pb-2 space-y-1", children: suites.map(s => {
                                const sId = s.lineageId;
                                const isActive = suiteId === sId && !protocolId;
                                return (_jsx(Link, { to: `/${section}/suites/${sId}`, className: `block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`, children: s.title }, sId));
                            }) })] }), _jsxs("details", { className: "group", open: !!protocolId, children: [_jsx("summary", { className: detailsSummaryClass, children: _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("svg", { className: "w-3.5 h-3.5 transition-transform group-open:rotate-90", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }), "Protocols"] }) }), _jsx("div", { className: "px-3 pb-2 space-y-1", children: protocols.length > 0 ? protocols.map(p => {
                                const slug = encodeURIComponent(p.id);
                                const isActive = protocolId === slug;
                                // Prepend the suiteId context to the URL if we have one active, otherwise just use /protocols
                                const targetUrl = suiteId ? `/${section}/suites/${suiteId}/protocols/${slug}` : `/${section}/protocols/${slug}`;
                                return (_jsx(Link, { to: targetUrl, className: `block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`, children: p.title }, p.id));
                            }) : (_jsx("div", { className: "pl-6 pr-3 py-2 text-sm text-gray-500", children: "No protocols found." })) })] }), subNeeds.length > 0 && (_jsxs("details", { className: "group", open: !!needId, children: [_jsx("summary", { className: detailsSummaryClass, children: _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("svg", { className: "w-3.5 h-3.5 transition-transform group-open:rotate-90", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }), "Sub-Needs"] }) }), _jsx("div", { className: "px-3 pb-2 space-y-1", children: subNeeds.map(n => {
                                const isActive = needId === n.lineageId;
                                return (_jsx(Link, { to: `/${section}/needs/${n.lineageId}`, className: `block pl-6 pr-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-blue-700 font-medium shadow-sm border border-gray-100" : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"}`, children: n.title }, n.lineageId));
                            }) })] }))] }) }));
}
function SectionIndex({ section }) {
    const repo = useRepo();
    const [intro, setIntro] = useState("");
    useEffect(() => {
        let mounted = true;
        (async () => {
            const sections = await repo.listSections();
            const current = sections.find((s) => s.id === section);
            if (mounted)
                setIntro(current?.intro ?? "");
        })();
        return () => { mounted = false; };
    }, [repo, section]);
    return (_jsxs("div", { className: "max-w-2xl mt-4 animate-fade-in-up", children: [_jsx("h1", { className: "text-3xl font-semibold capitalize mb-4 tracking-tight", children: section }), intro && _jsx("p", { className: "text-lg text-gray-600 mb-8 leading-relaxed", children: intro }), _jsx("div", { className: "p-6 rounded-2xl border bg-gray-50/50 border-dashed border-gray-200", children: _jsxs("p", { className: "text-gray-500 flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5 text-gray-400 hidden md:block", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }), "Select an item from the left sidebar to view its details."] }) })] }));
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
