// src/features/needs/NeedProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import type { Need } from "@/domain/types";
import { ProfileActions } from "@/features/marks/ProfileActions";
import { useFollowed } from "@/features/marks/useFollowed";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseVersion, STAGE_DISPLAY_MAP, formatVersion } from "@/lib/version";
import { getNeedRelease, latestNeedVersion, listNeedReleases } from "@/features/needs/lib/releases";
import { NeedVersionSwitcher } from "@/features/needs/components/NeedVersionSwitcher";
import { VersionHeader } from "@/components/VersionHeader";
import { NeedIcon } from "@/components/icons/NeedIcon";
import { FoundationLink } from "@/components/FoundationLink";
import { Edit } from "lucide-react";
import { useSession } from "@/features/auth/SessionProvider";
import NeedEditorProfile from "@/features/needs/components/NeedEditorProfile";

export function NeedProfile() {
  const { rootId = "", version: paramVersion } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const sectionId = location.pathname.split("/")[1] || "collaboration";
  const isEditing = location.pathname.endsWith("/edit");
  const repo = useRepo();
  const { session } = useSession();
  const [n, setN] = useState<Need | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Dynamically overlay tracking signal offsets
  const { isFollowed } = useFollowed(n?.lineageId ?? "", "need");

  // determine rootId and version from URL (like slug@ver pattern)
  const parsed = useMemo(() => {
    const raw = decodeURIComponent(rootId);
    const [slug, ver] = raw.split("@");
    return ver ? { slug, ver } : { slug };
  }, [rootId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      let need: Need | null = null;
      if (parsed.ver) {
        need = await repo.getNeedByVersion?.(parsed.slug, parsed.ver) ?? null;
      } else {
        need = await repo.getNeedByLineageId?.(parsed.slug) ?? null;
      }
      if (!alive) return;
      setN(need);
      setNotFound(!need);
    })();
    return () => { alive = false; };
  }, [parsed, repo]);

  if (notFound) return <Navigate to="/404" replace />;
  if (!n) return <div className="mx-auto max-w-3xl p-6">Loading need…</div>;

  // version info
  const selectedVersion = parsed.ver ?? paramVersion ?? (n as any).version ?? latestNeedVersion(n.lineageId) ?? "0.1.0";
  const release = n.release ?? getNeedRelease(n.lineageId, selectedVersion);
  const versionString = n.release?.version ?? (n as any).version ?? release?.version ?? selectedVersion;
  const { major } = parseVersion(versionString);
  const uiStage = release?.stage ?? (n as any).stage ?? (major === 0 ? "draft" : "stable");

  const uiStageDisplay = STAGE_DISPLAY_MAP[uiStage] || uiStage;

  // data normalization
  const description = release?.description ?? n.description ?? "";
  const purpose = release?.purpose ?? n.purpose ?? "";
  const tags = release?.tags?.length ? release.tags : ((n as any).tags ?? []);
  const language = release?.language || n.language || "en";
  
  const baseFollow = release?.followCount ?? 0;
  const followCount = isFollowed && baseFollow === 0 ? 1 : baseFollow;
  
  const date = release?.date ?? "";
  const versions = listNeedReleases(n.lineageId);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8 animate-fade-in-up">
      {/* Left Column: Editor or Content */}
      <div className="space-y-6">
        {isEditing ? (
            <NeedEditorProfile rootId={parsed.slug} onClose={() => nav("..", { relative: "path" })} />
        ) : (
          <article className="space-y-6">
            <header className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <NeedIcon className="text-gray-900 w-8 h-8 flex-shrink-0" />
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">{n.title}</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-1">
                  <ProfileActions 
                      subjectId={n.lineageId} 
                      kind="need"
                      editUrl="edit" 
                      newUrl={`/${sectionId}/needs/new`}
                      editTitle="Edit Need" 
                      followLabel="Follow need" 
                      showAdopt={false} 
                  />
                </div>
              </div>

              {/* badges + version switcher */}
              <VersionHeader
                  versionString={versionString}
                  uiStage={uiStage}
                  uiStageDisplay={uiStageDisplay}
                  language={language}
                  isPendingFork={n.familyEvent?.status === 'pending'}
                  switcher={
                    <NeedVersionSwitcher
                      rootId={ rootId }
                      currentVersion={ release?.version ?? versionString }
                      stage={uiStage}
                      onChange={(v) => {
                          const base = location.pathname.split("/v/")[0];
                          nav(`${base}/v/${v}`);
                      }}
                    />
                  }
              />
            </header>

            {purpose && <p className="text-lg text-gray-600 leading-relaxed italic">{purpose}</p>}

            <FoundationLink foundationRef={(n as any).foundationRef || (release as any)?.foundationRef} />

            <div className="my-4 border-t border-gray-100" />

            {/* Body */}
            {description ? (
              <section 
                className="prose max-w-none pt-2 
                prose-p:text-sm prose-p:text-gray-700 prose-p:leading-normal prose-p:mb-3
                prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-2
                prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5 prose-li:text-sm prose-li:text-gray-700 prose-li:mb-1.5
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                marker:text-gray-400 dark:prose-invert"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
              </section>
            ) : (
              <div className="text-sm text-gray-500">No description provided yet.</div>
            )}

            <footer className="mt-6 border-t border-gray-100 pt-3 text-sm italic text-gray-500 text-center">
              This need evolves as we learn together.
            </footer>
          </article>
        )}
      </div>

      {/* Right Column */}
      <div className="hidden lg:block space-y-6 lg:sticky lg:top-0 lg:self-start pt-6 lg:pt-0">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm leading-relaxed">
            <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Need Details</h3>
            <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-900">Release</div>
                        <div>v{formatVersion(versionString)}{date ? ` · ${date}` : ""}{language ? ` · ${language}` : ""}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-900">Signals</div>
                        <div className="flex items-center gap-4">
                            <span title="Followers">Follows: {followCount}</span>
                        </div>
                    </div>
                </div>

                {!!tags.length && (
                    <div>
                        <div className="text-sm font-medium text-gray-900">Tags</div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {tags.map((t) => (
                                <span key={t} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 font-medium">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
      </div>
    </div>
  );
}