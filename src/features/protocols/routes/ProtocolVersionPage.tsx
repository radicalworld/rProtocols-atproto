// src/pages/ProtocolVersionPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useRelease } from "@/features/protocols/hooks/useRelease";
import ProtocolBadge from "@/features/protocols/components/ProtocolBadge";
import { ProtocolVersionSwitcher } from "@/features/protocols/components/ProtocolVersionSwitcher";
import ReactMarkdown from "react-markdown";

export default function ProtocolVersionPage() {
  const { id = "", version } = useParams();
  const nav = useNavigate();
  const { release, releases, current, lineage } = useRelease(id, version);

  if (!release) {
    return <div className="p-6">Protocol or version not found.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold capitalize">{id.replace(/-/g, " ")}</h1>
          <div className="mt-2">
            <ProtocolBadge version={release.version} stage={release.stage} />
          </div>
        </div>
        <ProtocolVersionSwitcher
          id={id}
          currentVersion={release.version}
          onChange={(v) => nav(`/protocols/${id}/versions/${v}`)}
        />
      </div>

      {/* meta */}
      <div className="mt-4 text-sm text-zinc-600">
        <div>Current: {current}</div>
        {lineage.forkOf && <div>Fork of: <code>{lineage.forkOf}</code></div>}
        {lineage.previousVersion && <div>Previous: {lineage.previousVersion}</div>}
      </div>

      {/* purpose */}
      <p className="mt-6 text-zinc-800">{release.purpose}</p>

      {/* body */}
      <article className="prose mt-6">
        <ReactMarkdown>{release.protocolBody}</ReactMarkdown>
      </article>

      {/* footer */}
      {release.closing && <p className="mt-6 italic text-zinc-700">{release.closing}</p>}

      {/* attribution */}
      {release.attribution?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold">Attribution</h3>
          <ul className="mt-2 text-sm text-zinc-700">
            {release.attribution.map((a) => (
              <li key={a.did}>
                {a.name} — <code className="text-xs">{a.did}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}