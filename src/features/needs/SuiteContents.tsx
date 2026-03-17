import { useEffect, useState } from "react";
import { useRepo } from "@/domain/repo";
import type { Protocol } from "@/domain/types";
import { ProtocolActions } from "@/features/needs/ProtocolActions";
import { FollowEye } from "@/features/marks/FollowEye";
import { useLocation, Link } from "react-router-dom";

export function SuiteContents({ suiteId, suiteSlug, onSelectProtocol }: { suiteId: string; suiteSlug?: string; onSelectProtocol?: (protocolId: string) => void }) {
  const repo = useRepo();
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const section = pathParts[0] || "collaboration";
  const effectiveSuiteSlug = suiteSlug || suiteId;
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  useEffect(() => {
    let m = true;
    (async () => {
      const ps = await repo.getSuiteProtocols(suiteId);
      if (m) setProtocols(ps);
    })();
    return () => { m = false; };
  }, [repo, suiteId]);

  if (!protocols.length) return <div className="text-sm text-gray-600">No protocols yet.</div>;

  return (
    <ul className="space-y-2">
      {protocols.map((p) => (
        <li key={p.id} className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-medium">
                {onSelectProtocol ? (
                    <button 
                        onClick={(e) => { e.preventDefault(); onSelectProtocol(p.id); }} 
                        className="hover:underline text-left"
                    >
                        {p.title}
                    </button>
                ) : (
                    <Link to={`/${section}/protocols/${encodeURIComponent(p.id)}?suite=${effectiveSuiteSlug}`} className="hover:underline">
                        {p.title}
                    </Link>
                )}
            </div>
            {p.summary && <div className="text-xs text-gray-600">{p.summary}</div>}
          </div>
          <FollowEye subjectId={p.id} label="Follow protocol" />
        </li>
      ))}
    </ul>
  );
}