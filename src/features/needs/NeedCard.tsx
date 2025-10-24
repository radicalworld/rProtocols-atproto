import { useEffect, useMemo, useState } from "react";
import { useRepo } from "@/domain/repo";
import type { Need, NeedNode, Suite, Protocol } from "@/domain/types";
import { ListCard } from "./ListCard";
import { SuiteContents } from "@/features/needs/SuiteContents";
import { ProtocolExpanded } from "@/features/needs/ProtocolExpanded";
import { ProtocolActions } from "@/features/needs/ProtocolActions";
import { useFollowed } from "@/features/marks/useFollowed";
import { FollowEye } from "@/features/marks/FollowEye";

export function NeedCard({ needId }: { needId: string }) {
    const repo = useRepo();
    const [need, setNeed] = useState<Need | null>(null);
    const [node, setNode] = useState<NeedNode | null>(null);
    const [suites, setSuites] = useState<Suite[]>([]);
    const [allProtocols, setAllProtocols] = useState<Protocol[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
        const tree = await repo.getNeedTree(needId);
        const ss = await repo.getSuitesForNeed(needId);
        const ps = await repo.getProtocolsForNeed(needId);
        if (!mounted) return;
        setNode(tree);
        setNeed(tree);
        setSuites(ss);
        setAllProtocols(ps);
        })();
        return () => { mounted = false; };
    }, [repo, needId]);

    const standaloneProtocols = useMemo(() => {
        const suiteIds = new Set(suites.flatMap(s => s.protocolIds));
        return allProtocols.filter(p => !suiteIds.has(p.id));
    }, [suites, allProtocols]);

    const { isFollowed, markFollow } = useFollowed(needId);

    if (!need) return null;

    return (
        <section className="group rounded-2xl border bg-white p-5 shadow-sm">
            <header className="mb-2 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-xl font-semibold">{need.title}</h3>
                    {need.description && <p className="mt-1 text-gray-600">{need.description}</p>}
                </div>
                <div
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                    aria-hidden="true"
                >
                    <FollowEye subjectId={needId} label="Follow need" />
                </div>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Suites */}
                <ListCard
                    title="Suites"
                    items={suites.map(s => ({ id: s.id, title: s.title, subtitle: s.description }))}
                    empty="No suites yet."
                    expandedRenderer={(suiteId) => <SuiteContents suiteId={suiteId} />}
                    actionRenderer={(suiteId) => <FollowEye subjectId={suiteId} label="Follow suite" />}
                />

                {/* Protocols (standalone only) */}
                <ListCard
                    title="Protocols"
                    items={standaloneProtocols.map(p => ({ id: p.id, title: p.title, subtitle: p.summary }))}
                    empty="No standalone protocols yet."
                    expandedRenderer={(pid) => <ProtocolExpanded protocolId={pid} />}
                    actionRenderer={(pid) => <FollowEye subjectId={pid} label="Follow protocol" />}
                />

                {/* Sub-needs */}
                <ListCard
                    title="Sub-needs"
                    items={(node?.children ?? []).map(c => ({ id: c.id, title: c.title, subtitle: c.description }))}
                    empty="No sub-needs."
                    expandedRenderer={(childId) => <NeedCard needId={childId} />}
                />
            </div>
        </section>
    );
}