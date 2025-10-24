import { useParams, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNeed } from "@/features/needs/hooks/useNeed";
import { useNeedReleases } from "@/features/needs/hooks/useNeedReleases";
import { ProtocolVersionSwitcher } from "@/features/protocols/components/ProtocolVersionSwitcher"; // reuse if generic
import { FollowEye } from "@/features/marks/FollowEye";

export default function NeedVersionProfile() {
  const { rootId = "", version = "" } = useParams();
  const { release, loading, error } = useNeed(rootId, version);
  const { releases } = useNeedReleases(rootId);

  if (loading) return <div className="p-6">Loading version…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!release) return <Navigate to="/404" replace />;

  const versions = releases.map(r => r.version);

  return (
    <article className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold">{release.title}</h1>
        <FollowEye subjectId={rootId} label="Follow need" />
      </header>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>v{release.version} · {release.stage}{release.language ? ` · ${release.language}` : ""}</div>
        {versions.length > 0 && (
          <ProtocolVersionSwitcher
            id={rootId}
            currentVersion={release.version}
            onChange={(v) => (window.location.href = `/needs/${rootId}/v/${v}`)}
          />
        )}
      </div>

      {release.purpose && (
        <p className="italic text-gray-700">{release.purpose}</p>
      )}

      <section className="prose prose-zinc dark:prose-invert max-w-none">
        {release.description ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.description}</ReactMarkdown>
        ) : (
          <div className="text-sm text-gray-500">No description provided yet.</div>
        )}
      </section>
    </article>
  );
}