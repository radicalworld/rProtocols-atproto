import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useRepo } from "@/domain/repo";
import { ListCard } from "./ListCard";
import { SuiteContents } from "@/features/needs/SuiteContents";
import { useFollowed } from "@/features/marks/useFollowed";
import { FollowEye } from "@/features/marks/FollowEye";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import NeedEditorProfile from "@/features/needs/components/NeedEditorProfile";
export function NeedCard({ needId }) {
    const repo = useRepo();
    const [need, setNeed] = useState(null);
    const [node, setNode] = useState(null);
    const [suites, setSuites] = useState([]);
    const [allProtocols, setAllProtocols] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    useEffect(() => {
        let mounted = true;
        (async () => {
            const tree = await repo.getNeedTree(needId);
            const ss = await repo.getSuitesForNeed(needId);
            const ps = await repo.getProtocolsForNeed(needId);
            setNode(tree);
            // NeedNode extends NeedRelease which has question instead of title, etc.
            setNeed(tree);
            setSuites(ss);
            setAllProtocols(ps);
        })();
        return () => { mounted = false; };
    }, [repo, needId]);
    const standaloneProtocols = useMemo(() => {
        const suiteLineageIds = new Set(suites.flatMap(s => s.includeProtocols?.map(p => p.lineageId) || []));
        return allProtocols.filter(p => !suiteLineageIds.has(p.id));
    }, [suites, allProtocols]);
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const layoutState = useMemo(() => {
        const pathParts = location.pathname.split("/").filter(Boolean);
        const type1 = pathParts[1]; // "suites" | "protocols"
        const slug1 = pathParts[2];
        let expandedSuiteId = null;
        let selectedProtocolId = null;
        let sourceColumn = null;
        // If we're viewing a suite, it's expanded
        if (type1 === "suites" && slug1) {
            const match = suites.find(s => s.lineageId === slug1);
            if (match)
                expandedSuiteId = match.lineageId;
        }
        // If we're viewing a protocol, it's selected. Did they pass a suite context?
        else if (type1 === "protocols" && slug1) {
            const match = standaloneProtocols.find(p => p.id === slug1);
            if (match) {
                selectedProtocolId = match.id;
                sourceColumn = "protocols";
            }
            else {
                // If it's not a standalone protocol, it's probably nested inside a suite.
                selectedProtocolId = slug1;
                sourceColumn = "suites";
            }
            const suiteContext = searchParams.get("suite");
            if (suiteContext) {
                const sMatch = suites.find(s => s.lineageId === suiteContext);
                if (sMatch)
                    expandedSuiteId = sMatch.lineageId;
            }
        }
        return { expandedSuiteId, selectedProtocolId, sourceColumn };
    }, [location.pathname, searchParams, suites, standaloneProtocols]);
    const { isFollowed, toggleFollow } = useFollowed(needId);
    if (!need)
        return null;
    return (_jsxs("section", { className: "group rounded-2xl border bg-white p-5 shadow-sm", children: [_jsxs("header", { className: "mb-2 flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold", children: need.title }), need.description && _jsx("p", { className: "mt-1 text-gray-600", children: need.description })] }), _jsxs("div", { className: "shrink-0 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => setIsEditing(true), children: _jsx(Edit, { className: "w-4 h-4 text-gray-500 hover:text-gray-900" }) }), _jsx(FollowEye, { subjectId: needId, label: "Follow need" })] })] }), isEditing ? (_jsx("div", { className: "mt-4 border-t pt-4", children: _jsx(NeedEditorProfile, { rootId: needId, onClose: () => setIsEditing(false) }) })) : (_jsxs("div", { className: `grid gap-4 transition-all duration-300 ${layoutState.selectedProtocolId ? 'grid-cols-1' : 'md:grid-cols-3'}`, children: [(!layoutState.selectedProtocolId || layoutState.sourceColumn === "suites") && (_jsx(ListCard, { title: "Suites", items: suites.map(s => ({ id: s.lineageId, title: s.title, subtitle: s.description })), empty: "No suites yet.", expandedRenderer: (suiteId) => {
                            return (_jsx(SuiteContents, { suiteId: suiteId }));
                        }, onItemClick: (suiteId) => {
                            const suite = suites.find(s => s.lineageId === suiteId);
                            if (suite) {
                                const section = location.pathname.split("/")[0] || "collaboration";
                                // Toggle behavior: if already expanded without protocol, close it by pulling back.
                                if (layoutState.expandedSuiteId === suiteId && !layoutState.selectedProtocolId) {
                                    navigate(`/${section}`);
                                }
                                else {
                                    navigate(`/${section}/suites/${suite.lineageId}`);
                                }
                            }
                        }, activeItem: layoutState.expandedSuiteId, actionRenderer: (suiteId) => _jsx(FollowEye, { subjectId: suiteId, label: "Follow suite" }) })), (!layoutState.selectedProtocolId || layoutState.sourceColumn === "protocols") && (_jsx(ListCard, { title: "Protocols", items: standaloneProtocols.map(p => ({ id: p.id, title: p.title, subtitle: p.summary })), empty: "No standalone protocols yet.", onItemClick: (pid) => {
                            const prot = standaloneProtocols.find(p => p.id === pid);
                            if (prot) {
                                const section = location.pathname.split("/")[0] || "collaboration";
                                navigate(`/${section}/protocols/${prot.id}`);
                            }
                        }, activeItem: layoutState.selectedProtocolId, actionRenderer: (pid) => _jsx(FollowEye, { subjectId: pid, label: "Follow protocol" }) })), !layoutState.selectedProtocolId && (_jsx(ListCard, { title: "Sub-needs", items: (node?.children ?? []).map((c) => ({ id: c.needRootId || c.lineageId, title: c.question || c.title, subtitle: c.purpose || c.description })), empty: "No sub-needs.", expandedRenderer: (childId) => _jsx(NeedCard, { needId: childId }) }))] }))] }));
}
