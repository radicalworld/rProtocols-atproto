// src/features/needs/NeedProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import type { Need } from "@/domain/types";
import { FollowEye } from "@/features/marks/FollowEye";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseVersion } from "@/lib/version";
import { getNeedRelease, latestNeedVersion, listNeedReleases } from "@/features/needs/lib/releases";
import NeedBadge from "@/features/needs/components/NeedBadge";
import { NeedVersionSwitcher } from "@/features/needs/components/NeedVersionSwitcher";
import { useNeed, useNeedReleases } from "@/features/needs/hooks";

export function NeedProfile() {
  const { rootId = "" } = useParams();
  const nav = useNavigate();
  const repo = useRepo();
  const [n, setN] = useState<Need | null>(null);
  const [notFound, setNotFound] = useState(false);

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
        need = await repo.getNeedByRootId?.(parsed.slug) ?? null;
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
  const selectedVersion = parsed.ver ?? latestNeedVersion(n.id) ?? "1.0";
  const release = getNeedRelease(n.id, selectedVersion);
  const versionString = release?.version ?? selectedVersion;
  const { major, minor } = parseVersion(versionString);
  const uiStage = release?.stage ?? (major === 0 ? "draft" : "stable");

  // data normalization
  const description = release?.description ?? n.description ?? "";
  const purpose = release?.purpose ?? n.purpose ?? "";
  const tags = release?.tags ?? [];
  const language = release?.language ?? "";
  const followCount = release?.followCount ?? 0;
  const shortUrl = release?.shortUrl;
  const qrCode = release?.qrCode;
  const attribution = release?.attribution ?? [];
  const history = release?.history ?? [];
  const date = release?.date ?? "";
  const versions = listNeedReleases(n.id);

  return (
    <article className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-semibold">{n.title}</h1>
          <div className="flex items-center gap-2">
            <FollowEye subjectId={n.id} label="Follow need" />
          </div>
        </div>

        {/* badges + version switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NeedBadge version={`${major}.${minor}`} stage={uiStage} />
          </div>
          {versions.length > 0 && (
            <NeedVersionSwitcher
              rootId={ rootId }
              currentVersion={ release.version }
              onChange={(v) => nav(`/needs/${rootId}/v/${v}`)}
            />
          )}
        </div>
      </header>

      {purpose && <p className="text-gray-700 italic">{purpose}</p>}

      {/* Meta info */}
      <section className="mt-4 rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-sm leading-relaxed">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <div className="font-medium text-gray-900">Release</div>
            <div>
              v{major}.{minor}
              {date ? ` · ${date}` : ""}
              {language ? ` · ${language}` : ""}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Signals</div>
            <div>Follows: {followCount}</div>
          </div>
          {!!tags.length && (
            <div>
              <div className="font-medium text-gray-900">Tags</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {attribution.length > 0 && (
            <div className="sm:col-span-2">
              <div className="font-medium text-gray-900">Attribution</div>
              <ul className="mt-1 space-y-1">
                {attribution.map((a) => (
                  <li key={a.did} className="text-xs text-gray-600">
                    <span className="font-medium text-gray-800">{a.name}</span>{" "}
                    <span className="font-mono">{a.did}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {history.length > 0 && (
            <div className="sm:col-span-2">
              <div className="font-medium text-gray-900">History</div>
              <ul className="mt-1 space-y-0.5">
                {history.map((h) => (
                  <li key={h.version} className="text-xs text-gray-600">
                    <span className="font-medium text-gray-800">v{h.version}</span>
                    {h.date ? ` · ${h.date}` : ""}
                    {h.note ? ` — ${h.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <div className="my-4 border-t border-gray-100" />

      {/* Body */}
      {description ? (
        <section
          className="prose prose-zinc dark:prose-invert max-w-none
                     prose-headings:font-semibold prose-p:my-1.5 prose-ul:pl-5 prose-ol:pl-5"
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
  );
}