import { useEffect, useMemo, useState } from "react";
import { useRepo } from "@/domain/repo";
import type { Need, NeedNode, Suite, Protocol } from "@/domain/types";
import { ListCard } from "./ListCard";
import { SuiteContents } from "@/features/needs/SuiteContents";
import { ProtocolExpanded } from "@/features/needs/ProtocolExpanded";
import { ProtocolActions } from "@/features/needs/ProtocolActions";
import { useFollowed } from "@/features/marks/useFollowed";
import { FollowEye } from "@/features/marks/FollowEye";

import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import NeedEditorProfile from "@/features/needs/components/NeedEditorProfile";

export function NeedCard({ 
    needId
}: { 
    needId: string;
}) {
    const repo = useRepo();
    const [need, setNeed] = useState<Need | null>(null);
    const [node, setNode] = useState<NeedNode | null>(null);
    const [suites, setSuites] = useState<Suite[]>([]);
    const [allProtocols, setAllProtocols] = useState<Protocol[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
        const tree = await repo.getNeedTree(needId);
        const ss = await repo.getSuitesForNeed(needId);
        const ps = await repo.getProtocolsForNeed(needId);
        setNode(tree);
        // NeedNode extends NeedRelease which has question instead of title, etc.
        setNeed(tree as unknown as Need);
        setSuites(ss);
        setAllProtocols(ps);
        })();
        return () => { mounted = false; };
    }, [repo, needId]);

    const standaloneProtocols = useMemo(() => {
        const suiteIds = new Set(suites.flatMap(s => s.includeProtocols?.map(p => p.rootId) || []));
        return allProtocols.filter(p => !suiteIds.has(p.id));
    }, [suites, allProtocols]);

    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const layoutState = useMemo(() => {
        const pathParts = location.pathname.split("/").filter(Boolean);
        const type1 = pathParts[1]; // "suites" | "protocols"
        const slug1 = pathParts[2];
        
        let expandedSuiteId: string | null = null;
        let selectedProtocolId: string | null = null;
        let sourceColumn: "suites" | "protocols" | null = null;

        // If we're viewing a suite, it's expanded
        if (type1 === "suites" && slug1) {
            const match = suites.find(s => s.rootId === slug1);
            if (match) expandedSuiteId = match.rootId;
        } 
        // If we're viewing a protocol, it's selected. Did they pass a suite context?
        else if (type1 === "protocols" && slug1) {
            const match = standaloneProtocols.find(p => p.id === slug1);
            if (match) {
                selectedProtocolId = match.id;
                sourceColumn = "protocols";
            } else {
                // If it's not a standalone protocol, it's probably nested inside a suite.
                selectedProtocolId = slug1;
                sourceColumn = "suites";
            }
            
            const suiteContext = searchParams.get("suite");
            if (suiteContext) {
                const sMatch = suites.find(s => s.rootId === suiteContext);
                if (sMatch) expandedSuiteId = sMatch.rootId;
            }
        }
        
        return { expandedSuiteId, selectedProtocolId, sourceColumn };
    }, [location.pathname, searchParams, suites, standaloneProtocols]);

    const { isFollowed, toggleFollow } = useFollowed(needId);

    if (!need) return null;

    return (
        <section className="group rounded-2xl border bg-white p-5 shadow-sm">
            <header className="mb-2 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-xl font-semibold">{need.title}</h3>
                    {need.description && <p className="mt-1 text-gray-600">{need.description}</p>}
                </div>
                <div
                    className="shrink-0 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                >
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 text-gray-500 hover:text-gray-900" />
                    </Button>
                    <FollowEye subjectId={needId} label="Follow need" />
                </div>
            </header>

            {isEditing ? (
                <div className="mt-4 border-t pt-4">
                    <NeedEditorProfile rootId={needId} onClose={() => setIsEditing(false)} />
                </div>
            ) : (
                <div className={`grid gap-4 transition-all duration-300 ${layoutState.selectedProtocolId ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
                    {/* Suites */}
                    {(!layoutState.selectedProtocolId || layoutState.sourceColumn === "suites") && (
                        <ListCard
                            title="Suites"
                            items={suites.map(s => ({ id: s.rootId, title: s.title, subtitle: s.description }))}
                            empty="No suites yet."
                            expandedRenderer={(suiteId) => {
                                return (
                                    <SuiteContents 
                                        suiteId={suiteId} 
                                    />
                                );
                            }}
                            onItemClick={(suiteId) => {
                                const suite = suites.find(s => s.rootId === suiteId);
                                if (suite) {
                                    const section = location.pathname.split("/")[0] || "collaboration";
                                    // Toggle behavior: if already expanded without protocol, close it by pulling back.
                                    if (layoutState.expandedSuiteId === suiteId && !layoutState.selectedProtocolId) {
                                        navigate(`/${section}`);
                                    } else {
                                        navigate(`/${section}/suites/${suite.rootId}`);
                                    }
                                }
                            }}
                            activeItem={layoutState.expandedSuiteId}
                            actionRenderer={(suiteId) => <FollowEye subjectId={suiteId} label="Follow suite" />}
                        />
                    )}

                    {/* Protocols (standalone only) */}
                    {(!layoutState.selectedProtocolId || layoutState.sourceColumn === "protocols") && (
                        <ListCard
                            title="Protocols"
                            items={standaloneProtocols.map(p => ({ id: p.id, title: p.title, subtitle: p.summary }))}
                            empty="No standalone protocols yet."
                            onItemClick={(pid) => {
                                const prot = standaloneProtocols.find(p => p.id === pid);
                                if (prot) {
                                    const section = location.pathname.split("/")[0] || "collaboration";
                                    navigate(`/${section}/protocols/${prot.id}`);
                                }
                            }}
                            activeItem={layoutState.selectedProtocolId}
                            actionRenderer={(pid) => <FollowEye subjectId={pid} label="Follow protocol" />}
                        />
                    )}

                    {/* Sub-needs (Hide when a protocol is selected) */}
                    {!layoutState.selectedProtocolId && (
                        <ListCard
                            title="Sub-needs"
                            items={(node?.children ?? []).map((c: any) => ({ id: c.needRootId || c.rootId, title: c.question || c.title, subtitle: c.purpose || c.description }))}
                            empty="No sub-needs."
                            expandedRenderer={(childId) => <NeedCard needId={childId} />}
                        />
                    )}
                </div>
            )}
        </section>
    );
}