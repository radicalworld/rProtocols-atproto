import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import type { Protocol } from "@/domain/types";
import { FollowEye } from "@/features/marks/FollowEye";
import { AdoptButton } from "@/features/marks/AdoptButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseVersion } from "@/lib/version";
import { getRelease, latestVersion, listReleases } from "@/features/protocols/lib/releases";
import { protocolReleases } from "@/data/releases";
import ProtocolBadge from "@/features/protocols/components/ProtocolBadge";
import { ProtocolVersionSwitcher } from "@/features/protocols/components/ProtocolVersionSwitcher";
import { useNavigate } from "react-router-dom";

export function ProtocolProfile() {
    const { id = "" } = useParams();
    const nav = useNavigate();
    const repo = useRepo();
    const [p, setP] = useState<Protocol | null>(null);
    const [notFound, setNotFound] = useState(false);

    const parsed = useMemo(() => {
        // support: /protocol/:slug , /protocol/:slug@v1.2.3 , /protocol/cid/<cid>
        const raw = decodeURIComponent(id);
        if (raw.startsWith("cid/")) return { kind: "cid" as const, cid: raw.slice(4) };
        const [slug, ver] = raw.split("@");
        return ver ? { kind: "slugVer" as const, slug, ver } : { kind: "slug" as const, slug };
    }, [id]);

    const isZeroMajor = parsed.kind === "slugVer" && parsed.ver?.startsWith("0.");

    useEffect(() => {
        let alive = true;
        (async () => {
                let proto: Protocol | null = null;
            if (parsed.kind === "cid") {
                proto = await repo.getProtocolByCid?.(parsed.cid) ?? null;
            } else if (parsed.kind === "slugVer") {
                proto = await repo.getProtocolByVersion?.(parsed.slug, parsed.ver) ?? null;
            } else {
                proto = await repo.getProtocolBySlug?.(parsed.slug) ?? null;
                // fallback to old behavior while we migrate
                if (!proto) proto = await repo.getProtocol(parsed.slug);
            }
            if (!alive) return;
            setP(proto);
            setNotFound(!proto);
        })();
        return () => { alive = false; };
    }, [parsed, repo]);

    if (notFound) return <Navigate to="/404" replace />;
    if (!p) return <div className="mx-auto max-w-3xl p-6">Loading protocol…</div>;

    // get version info from releases
    const selectedVersion =
        parsed.kind === "slugVer"
            ? parsed.ver
            : latestVersion(p.id) ?? "1.0";

    const release = getRelease(p.id, selectedVersion);
    const versionString = release?.version ?? selectedVersion ?? "1.0";
    const { major, minor } = parseVersion(versionString);

    // normalize stage names
    const uiStage: "draft" | "candidate" | "stable" | "archived" =
        release?.stage === "rc"
            ? "candidate"
            : release?.stage === "published"
            ? "stable"
            : (release?.stage ?? (major === 0 ? "draft" : "stable")) as any;

    const body = release?.protocolBody ?? p.body ?? "";
    const canAdopt = release?.adoptEnabled ?? true;
    const versions = listReleases(p.id);
    const tags = release?.tags ?? [];
    const purpose = release?.purpose ?? p.summary ?? "";
    const date = release?.date ?? "";
    const language = release?.language ?? "";
    const followCount = release?.followCount ?? 0;
    const adoptCount = release?.adoptCount ?? 0;
    const shortUrl = release?.shortUrl;
    const qrCode = release?.qrCode;

    const cid = release?.cid;
    const did = release?.did;
    const needId = release?.needId;
    const scope = release?.scope;
    const related = release?.relatedProtocols ?? [];
    const history = release?.history ?? [];
    const attribution = release?.attribution ?? [];

    if (notFound) return <Navigate to="/404" replace />;

    if (!p) return <div className="mx-auto max-w-3xl p-6">Loading protocol…</div>;

    return (
        <article className="mx-auto max-w-3xl space-y-6 p-6">
            <header className="flex flex-col gap-2">
                {/* top row: title + action buttons */}
                <div className="flex items-start justify-between">
                <h1 className="text-2xl font-semibold">{p.title}</h1>
                <div className="flex items-center gap-2">
                    <FollowEye subjectId={p.id} label="Follow protocol" />
                    <AdoptButton subjectId={p.id} disabled={!canAdopt || versionString.startsWith("0.")} />
                </div>
                </div>

                {/* second row: version badges + switcher */}
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ProtocolBadge
                    version={`${major}.${minor}`}
                    stage="published"
                    />
                    <ProtocolBadge
                    version={uiStage}
                    stage={uiStage === "stable" ? "published" : uiStage as any}
                    />
                </div>
                {versions.length > 0 && (
                    <ProtocolVersionSwitcher
                    id={p.id}
                    currentVersion={`${major}.${minor}`}
                    onChange={(v) => nav(`/protocols/${p.id}/versions/${v}`)}
                    />
                )}
                </div>
            </header>

            {p.summary && <p className="text-gray-700">{p.summary}</p>}

            {/* --- Meta panel (separate from body) --- */}
            <section className="mt-4 rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-sm leading-relaxed">
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                    <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-900">Release</div>
                        <div>v{major}.{minor}{date ? ` · ${date}` : ""}{language ? ` · ${language}` : ""}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-900">Signals</div>
                        <div className="flex items-center gap-4">
                            <span title="Followers">Follows: {followCount}</span>
                            <span title="Adoptions">Adopts: {adoptCount}</span>
                        </div>
                    </div>
                    {needId && (
                      <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-900">Need</div>
                        <div>{needId}</div>
                      </div>
                    )}
                    {scope?.region && (
                      <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-900">Region</div>
                        <div>{scope.region.level}{scope.region.name ? ` · ${scope.region.name}` : ""}</div>
                      </div>
                    )}
                    {cid && (
                      <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-900">CID</div>
                        <div className="font-mono text-xs break-all">{cid}</div>
                      </div>
                    )}
                    {did && (
                      <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-900">DID</div>
                        <div className="font-mono text-xs break-all">{did}</div>
                      </div>
                    )}
                    {!!tags.length && (
                        <div className="sm:col-span-2">
                            <div className="text-sm font-medium text-gray-900">Tags</div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {tags.map(t => (
                                    <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {(shortUrl || qrCode) && (
                        <div className="sm:col-span-2 text-sm text-gray-600">
                            <div className="font-medium text-gray-900">Share</div>
                            <div className="mt-1 flex items-center gap-3">
                                {shortUrl && (
                                    <a
                                        className="underline underline-offset-2 hover:text-gray-900"
                                        href={`https://${shortUrl.replace(/^https?:\/\//, "")}`}
                                        target="_blank" rel="noreferrer"
                                    >
                                        {shortUrl}
                                    </a>
                                )}
                                {qrCode && <span className="text-xs text-gray-500">{qrCode}</span>}
                            </div>
                        </div>
                    )}
                    {related.length > 0 && (
                      <div className="sm:col-span-2">
                        <div className="text-sm font-medium text-gray-900">Related Protocols</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {related.map(r => (
                            <span key={r} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {attribution.length > 0 && (
                      <div className="sm:col-span-2">
                        <div className="text-sm font-medium text-gray-900">Attribution</div>
                        <ul className="mt-1 space-y-1">
                          {attribution.map(a => (
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
                        <div className="text-sm font-medium text-gray-900">History</div>
                        <ul className="mt-1 space-y-0.5">
                          {history.map(h => (
                            <li key={h.version} className="text-xs text-gray-600">
                              <span className="font-medium text-gray-800">v{h.version}</span>
                              {h.date ? ` · ${h.date}` : ""}{h.note ? ` — ${h.note}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
            </section>

            {/* Divider before body */}
            <div className="my-4 border-t border-gray-100" />

            {/* Body of the Protocol */}
            {body ? (
                <section
                    className="
                        prose prose-zinc dark:prose-invert max-w-none
                        prose-headings:font-semibold
                        prose-h1:text-2xl prose-h1:mt-3 prose-h1:mb-1.5
                        prose-h2:text-xl  prose-h2:mt-4 prose-h2:mb-1.5
                        prose-h3:text-lg  prose-h3:mt-3 prose-h3:mb-1.5
                        prose-p:my-1.5
                        prose-ul:my-0.5 prose-ol:my-1
                        prose-li:my-0.25
                        prose-ul:pl-5 prose-ol:pl-5"
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                </section>
            ) : (
                <div className="text-sm text-gray-500">No content yet.</div>
            )}
            
            {/* Closing note (kept visible at bottom for collaborators) */}
            
            <footer className="mt-6 border-t border-gray-100 pt-3 text-sm italic text-gray-500 text-center">
                This protocol is an experiment. Fork and improve as needed.
            </footer>
            
        </article>
    );
}