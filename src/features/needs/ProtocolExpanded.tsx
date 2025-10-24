import { useEffect, useState } from "react";
import { useRepo } from "@/domain/repo";
import type { Protocol } from "@/domain/types";
import { FollowEye } from "@/features/marks/FollowEye";
import { Link } from "react-router-dom";


export function ProtocolExpanded({ protocolId }: { protocolId: string }) {
    const repo = useRepo();
    const [p, setP] = useState<Protocol | null>(null);

    useEffect(() => {
        let m = true;
        (async () => {
            // TODO: add repo.getProtocol(id). For now, try to find it via suites you're already using.
            const candidates = await repo.getSuiteProtocols("suite-root-protocols");
            const found = candidates.find((x) => x.id === protocolId);
            if (m) setP(found ?? { id: protocolId, title: protocolId });
        })();
        return () => { m = false; };
    }, [repo, protocolId]);

    return (
        <div className="space-y-2">
            <div className="text-sm text-gray-700">{p?.summary ?? "Protocol details"}</div>
            <div className="flex items-center gap-2">
                <FollowEye subjectId={protocolId} label="Follow protocol" />
                <Link
                    to={`/protocol/${encodeURIComponent(protocolId)}`}
                    className="text-xs underline decoration-dotted underline-offset-4 text-gray-700"
                >
                    Open
                </Link>
            </div>
        </div>
    );
}