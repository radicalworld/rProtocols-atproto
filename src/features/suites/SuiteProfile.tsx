import { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import type { Suite, Protocol } from "@/domain/types";
import { FollowEye } from "@/features/marks/FollowEye";
import { AdoptButton } from "@/features/marks/AdoptButton";
import { useSession } from "@/features/auth/SessionProvider";
import { Pencil } from "lucide-react";
import SuiteEditorProfile from "@/features/suites/SuiteEditorProfile";
import ProtocolBadge from "@/features/protocols/components/ProtocolBadge";
import { useFollowed } from "@/features/marks/useFollowed";
import { useAdopted } from "@/features/marks/useAdopted";

export function SuiteProfile({ suiteId: propId }: { suiteId?: string } = {}) {
  const { id: paramId = "" } = useParams();
  const id = propId || paramId;
  const location = useLocation();
  const nav = useNavigate();
  const repo = useRepo();
  const { session } = useSession();
  const [suite, setSuite] = useState<Suite | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const isEditing = location.pathname.endsWith("/edit");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id || isEditing) return;
      const s = await repo.getSuite(decodeURIComponent(id));
      if (!alive) return;
      setSuite(s);
      if (s) setProtocols(await repo.getSuiteProtocols(s.lineageId));
    })();
    return () => { alive = false; };
  }, [id, repo, isEditing]);


  const { isFollowed } = useFollowed(suite?.lineageId ?? "");
  const baseFollow = suite?.followCount ?? 0;
  const followCount = isFollowed && baseFollow === 0 ? 1 : baseFollow;

  const { adopted: isAdopted } = useAdopted(suite?.lineageId ?? "");
  const baseAdopt = suite?.adoptCount ?? 0;
  const adoptCount = isAdopted && baseAdopt === 0 ? 1 : baseAdopt;

  if (!suite) return <div className="mx-auto max-w-4xl p-6">Loading suite…</div>;

  const versionString = suite.version || "0.1.0";
  const uiStage = (suite.stage as any) || "draft";
  const uiStageDisplay = uiStage === "stable" ? "Ready to Use" : uiStage === "candidate" ? "Ready for Review" : "Still Evolving";
  const language = suite.language || "en";
  const tags = suite.tags || [];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8 animate-fade-in-up">
      {/* Left Column: Editor or Metadata & Details */}
      <div className="space-y-6">
        {isEditing ? (
            <SuiteEditorProfile rootId={id} onClose={() => nav("..", { relative: "path" })} />
        ) : (
          <>
            <header className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{suite.title}</h1>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                {session && (
                    <Link
                        to="edit"
                        className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                        title="Edit Suite"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit Suite</span>
                    </Link>
                )}
                <FollowEye subjectId={suite.lineageId} label="Follow suite" />
                <AdoptButton subjectId={suite.lineageId} disabled={versionString.startsWith("0.")} />
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2">
                    <ProtocolBadge version={`v${versionString}`} stage="stable" />
                    <ProtocolBadge version={uiStageDisplay} stage={uiStage} />
                    {language && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 border border-gray-200 uppercase tracking-widest">
                            {language}
                        </span>
                    )}
                </div>
            </div>
          </header>
          
          {(suite.description || suite.purpose) && (
              <p className="text-lg text-gray-600 leading-relaxed">{suite.description || suite.purpose}</p>
          )}
          {/* Main Body: Protocols List */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Protocols in Suite
            </h2>
            {protocols.length === 0 ? (
              <div className="text-sm font-medium text-gray-500 py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No protocols have been mapped to this suite yet.
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                {protocols.map((p) => {
                   // Use relative linking to slide into Protocol view
                   const slug = encodeURIComponent(p.id);
                   return (
                      <li key={p.id} className="group flex flex-col gap-1.5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
                        <div className="flex items-start justify-between gap-3">
                            <Link to={`protocols/${slug}`} className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {p.title}
                            </Link>
                            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <FollowEye subjectId={p.id} label="Follow protocol" />
                            </div>
                        </div>
                        {p.summary && <div className="text-xs text-gray-500 leading-relaxed line-clamp-3">{p.summary}</div>}
                      </li>
                   )
                })}
              </ul>
            )}
          </div>
        </>
        )}
      </div>

      {/* Right Column: Metadata Details & Protocols List */}
      <aside className="space-y-6">
        
        {/* SUITE DETAILS CARD */}
        <div className="rounded-2xl border bg-gray-50/80 p-5 shadow-sm lg:sticky lg:top-0">
            <h2 className="mb-4 font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3">
                Suite Details
            </h2>
            
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Release</h3>
                        <p className="text-sm text-gray-900 leading-relaxed">
                            v{versionString} &middot; {language || "en"}
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Signals</h3>
                        <p className="text-sm text-gray-900 leading-relaxed">
                            Follows: {followCount}
                            <span className="block text-gray-900 mt-0.5">Adopts: {adoptCount}</span>
                        </p>
                    </div>
                </div>

                {tags.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map(t => (
                                <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* NO SECONDARY CARDS - Protocol Array moved to primary wrapper above */}
      </aside>
    </div>
  );
}