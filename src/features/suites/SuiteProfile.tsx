import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import type { Suite, Protocol } from "@/domain/types";
import { FollowEye } from "@/features/marks/FollowEye";
import { AdoptButton } from "@/features/marks/AdoptButton";

export function SuiteProfile({ suiteId: propId }: { suiteId?: string } = {}) {
  const { id: paramId = "" } = useParams();
  const id = propId || paramId;
  const repo = useRepo();
  const [suite, setSuite] = useState<Suite | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      const s = await repo.getSuite(decodeURIComponent(id));
      if (!alive) return;
      setSuite(s);
      if (s) setProtocols(await repo.getSuiteProtocols(s.rootId));
    })();
    return () => { alive = false; };
  }, [id, repo]);

  if (!suite) return <div className="mx-auto max-w-4xl p-6">Loading suite…</div>;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8 animate-fade-in-up">
      {/* Left Column: Metadata & Details */}
      <div className="space-y-6">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{suite.title}</h1>
              {suite.description && <p className="mt-2 text-lg text-gray-600 leading-relaxed">{suite.description}</p>}
            </div>
            <div className="flex gap-2 shrink-0 mt-1">
              <FollowEye subjectId={suite.rootId} label="Follow suite" />
            </div>
          </header>
          
          <div className="p-6 rounded-2xl border bg-gray-50/50 border-dashed border-gray-200">
             <p className="text-gray-500 mb-2 font-medium">Suite Details</p>
             <p className="text-sm text-gray-500">Suite metadata editor and full description would go here. Layout is prepared for the Master-Detail split.</p>
          </div>
      </div>

      {/* Right Column: Protocols List */}
      <section className="rounded-2xl border bg-gray-50/80 p-5 shadow-sm lg:sticky lg:top-0 lg:self-start">
        <h2 className="mb-4 font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Protocols in Suite
        </h2>
        {protocols.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">No protocols found in this suite.</div>
        ) : (
          <ul className="space-y-2.5">
            {protocols.map((p) => {
               // Use relative linking to slide into Protocol view
               const slug = encodeURIComponent(p.id);
               return (
                  <li key={p.id} className="flex flex-col gap-1.5 rounded-xl border bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                        <Link to={`protocols/${slug}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {p.title}
                        </Link>
                        <FollowEye subjectId={p.id} label="Follow protocol" />
                    </div>
                    {p.summary && <div className="text-xs text-gray-500 leading-relaxed line-clamp-2">{p.summary}</div>}
                  </li>
               )
            })}
          </ul>
        )}
      </section>
    </div>
  );
}