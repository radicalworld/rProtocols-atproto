import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import type { Suite, Protocol } from "@/domain/types";
import { FollowEye } from "@/features/marks/FollowEye";
import { AdoptButton } from "@/features/marks/AdoptButton";

export function SuiteProfile() {
  const { id = "" } = useParams();
  const repo = useRepo();
  const [suite, setSuite] = useState<Suite | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await repo.getSuite(decodeURIComponent(id));
      if (!alive) return;
      setSuite(s);
      if (s) setProtocols(await repo.getSuiteProtocols(s.id));
    })();
    return () => { alive = false; };
  }, [id, repo]);

  if (!suite) return <div className="mx-auto max-w-4xl p-6">Loading suite…</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{suite.title}</h1>
          {suite.description && <p className="mt-1 text-gray-600">{suite.description}</p>}
        </div>
        <div className="flex gap-2">
          <FollowEye subjectId={suite.id} label="Follow suite" />
          {/* Adopt at suite-level is optional; keep it if suites are adoptable */}
          {/* <AdoptButton subjectId={suite.id} /> */}
        </div>
      </header>

      <section className="rounded-2xl border bg-gray-50 p-4">
        <h2 className="mb-3 font-medium">Protocols in this suite</h2>
        {protocols.length === 0 ? (
          <div className="text-sm text-gray-600">No protocols yet.</div>
        ) : (
          <ul className="space-y-3">
            {protocols.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-2 rounded-lg border bg-white p-3">
                <div>
                  <Link to={`/protocol/${encodeURIComponent(p.slug ?? p.id)}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  {p.summary && <div className="text-sm text-gray-600">{p.summary}</div>}
                </div>
                <FollowEye subjectId={p.id} label="Follow protocol" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}