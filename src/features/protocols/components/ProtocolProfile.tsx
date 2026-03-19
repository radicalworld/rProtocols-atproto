import { useEffect, useMemo, useState } from "react";
import { useParams, Navigate, useMatch } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import type { Protocol } from "@/domain/types";
import { FollowEye } from "@/features/marks/FollowEye";
import { useFollowed } from "@/features/marks/useFollowed";
import { AdoptButton } from "@/features/marks/AdoptButton";
import { useAdopted } from "@/features/marks/useAdopted";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseVersion } from "@/lib/version";
import { getRelease, latestVersion, listReleases } from "@/features/protocols/lib/releases";
import { protocolReleases } from "@/data/releases";
import ProtocolBadge from "@/features/protocols/components/ProtocolBadge";
import { ProtocolVersionSwitcher } from "@/features/protocols/components/ProtocolVersionSwitcher";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Pencil } from "lucide-react";
import ProtocolEditorProfile from "@/features/protocols/components/ProtocolEditorProfile";
import { useSession } from "@/features/auth/SessionProvider";

export function ProtocolProfile({ protocolId: propId }: { protocolId?: string } = {}) {
    const { id: paramId = "" } = useParams();
    const id = propId || paramId;
    const nav = useNavigate();
    const location = useLocation();
    const isEditing = location.pathname.endsWith("/edit");
    const repo = useRepo();
    const { session } = useSession();
    const [p, setP] = useState<Protocol | null>(null);
    const [notFound, setNotFound] = useState(false);
    
    // Wire up dynamic tracking overlays to combat stale static JSON caches
    const { isFollowed } = useFollowed(p?.id ?? "");
    const { adopted: isAdopted } = useAdopted(p?.id ?? "");

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
    }, [parsed, repo, isEditing]);

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
    const rawStage = release?.stage;
    const computedStageFallback = major === 0 ? "draft" : "stable";
    
    console.log("[DEBUG: ProtocolProfile] Rendering Profile:", { p_id: p.id, selectedVersion, stage_from_release: rawStage, fallback: computedStageFallback });

    const uiStage: "draft" | "candidate" | "stable" | "archived" =
        rawStage === "candidate"
            ? "candidate"
            : rawStage === "stable"
            ? "stable"
            : (rawStage ?? computedStageFallback) as any;

    const stageDisplayMap: Record<string, string> = {
        draft: "Still Evolving",
        candidate: "Ready for Review",
        stable: "Ready to Use",
        archived: "Archived"
    };
    const uiStageDisplay = stageDisplayMap[uiStage] || uiStage;

    const body = p.body || release?.protocolBody || "";
    const canAdopt = release?.adoptEnabled ?? true;
    const versions = listReleases(p.id);
    const tags = release?.tags ?? [];
    const purpose = release?.purpose ?? p.summary ?? "";
    const date = release?.date ?? "";
    const language = release?.language ?? "";
    
    // Dynamically guarantee 0-state overrides if the active session proves network signals exist
    const baseFollow = release?.followCount ?? 0;
    const followCount = isFollowed && baseFollow === 0 ? 1 : baseFollow;
    
    const baseAdopt = release?.adoptCount ?? 0;
    const adoptCount = isAdopted && baseAdopt === 0 ? 1 : baseAdopt;

    const shortUrl = release?.shortUrl;
    const qrCode = release?.qrCode;

    const cid = release?.cid;
    const did = release?.did;
    // 1) Link back to Needs
    const needLineageId = (p as any).needLineageId;
    const scope = release?.scope;
    const related = release?.relatedProtocols ?? [];
    const history = release?.history ?? [];
    const attribution = release?.attribution ?? [];

    if (notFound) return <Navigate to="/404" replace />;

    if (!p) return <div className="mx-auto max-w-3xl p-6">Loading protocol…</div>;

    return (
        <article className="mx-auto max-w-[1200px] space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8 animate-fade-in-up">
            
            {/* Left Column: Editor & Body */}
            <div className="space-y-6">
                {isEditing ? (
                    <ProtocolEditorProfile protocolId={p.id} onClose={() => nav("..", { relative: "path" })} />
                ) : (
                    <>
                        <header className="flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{p.title || release?.title}</h1>
                            <div className="flex items-center gap-2 shrink-0 mt-1">
                                {session && (
                                <Link
                                    to="edit"
                                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                                    title="Edit Protocol"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span className="sr-only">Edit Protocol</span>
                                </Link>
                                )}
                                <FollowEye subjectId={p.id} label="Follow protocol" />
                                <AdoptButton subjectId={p.id} disabled={!canAdopt || versionString.startsWith("0.")} />
                            </div>
                            </div>

                            <div className="flex items-center justify-between bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2">
                                <ProtocolBadge version={`v${versionString}`} stage="stable" />
                                <ProtocolBadge version={uiStageDisplay} stage={uiStage === "stable" ? "stable" : uiStage as any} />
                                {language && (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 border border-gray-200 uppercase tracking-widest">
                                        {language}
                                    </span>
                                )}
                            </div>
                            {versions.length > 0 && (
                                <ProtocolVersionSwitcher id={p.id} currentVersion={versionString} onChange={(v) => nav(`/protocols/${p.id}/versions/${v}`)} />
                            )}
                            </div>
                        </header>

                        {(p.summary || release?.summary) && <p className="text-lg text-gray-600 leading-relaxed">{p.summary || release?.summary}</p>}

                        {/* Body of the Protocol */}
                        {body ? (
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
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                            </section>
                        ) : (
                            <div className="text-sm text-gray-500 py-8 text-center border-t border-gray-100 mt-8">No content yet.</div>
                        )}
                        
                        <footer className="mt-8 border-t border-gray-100 pt-6 text-sm italic text-gray-500 text-center">
                            This protocol is an experiment. Fork and improve as needed.
                        </footer>
                    </>
                )}
            </div>

            {/* Right Column: Meta & Children */}
            <div className="space-y-6 lg:sticky lg:top-0 lg:self-start pt-2 lg:pt-0">
                
                {/* Protocol Meta Information */}
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm leading-relaxed">
                    <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Protocol Details</h3>
                    <div className="flex flex-col gap-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-sm text-gray-600">
                                <div className="font-medium text-gray-900">Release</div>
                                <div>v{versionString}{date ? ` · ${date}` : ""}{language ? ` · ${language}` : ""}</div>
                            </div>
                            <div className="text-sm text-gray-600">
                                <div className="font-medium text-gray-900">Signals</div>
                                <div className="flex items-center gap-4">
                                    <span title="Followers">Follows: {followCount}</span>
                                    <span title="Adoptions">Adopts: {adoptCount}</span>
                                </div>
                            </div>
                        </div>
                        {needLineageId && (
                            <div className="text-sm text-gray-600">
                            <div className="font-medium text-gray-900">Need</div>
                            <div>{needLineageId}</div>
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
                            <div className="font-medium text-gray-900">CID Address</div>
                            <div className="font-mono text-xs break-all bg-gray-50 p-1.5 rounded mt-1 border border-gray-100">{cid}</div>
                            </div>
                        )}
                        {did && (
                            <div className="text-sm text-gray-600">
                            <div className="font-medium text-gray-900">Publisher DID</div>
                            <div className="font-mono text-xs break-all bg-gray-50 p-1.5 rounded mt-1 border border-gray-100">{did}</div>
                            </div>
                        )}
                        {!!tags.length && (
                            <div>
                                <div className="text-sm font-medium text-gray-900">Tags</div>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {tags.map(t => (
                                        <span key={t} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 font-medium">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(shortUrl || qrCode) && (
                            <div className="text-sm text-gray-600">
                                <div className="font-medium text-gray-900">Share</div>
                                <div className="mt-1 flex items-center gap-3">
                                    {shortUrl && (
                                        <a className="text-blue-600 hover:underline" href={`https://${shortUrl.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer">
                                            {shortUrl}
                                        </a>
                                    )}
                                    {qrCode && <span className="text-xs text-gray-500">{qrCode}</span>}
                                </div>
                            </div>
                        )}
                        {related.length > 0 && (
                            <div>
                            <div className="text-sm font-medium text-gray-900">Related Protocols</div>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                                {related.map(r => (
                                <span key={r} className="rounded bg-blue-50 text-blue-700 px-2 py-1 text-xs font-medium">
                                    {r}
                                </span>
                                ))}
                            </div>
                            </div>
                        )}
                        {attribution.length > 0 && (
                            <div>
                            <div className="text-sm font-medium text-gray-900 mb-1.5">Attribution</div>
                            <ul className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                {attribution.map(a => (
                                <li key={a.did} className="text-xs text-gray-600 flex flex-col gap-0.5">
                                    <span className="font-semibold text-gray-900">{a.name}</span>
                                    <span className="font-mono text-[10px] text-gray-500">{a.did}</span>
                                </li>
                                ))}
                            </ul>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sub-Needs Placeholder */}
                <section className="rounded-2xl border bg-gray-50/80 p-5 shadow-sm">
                    <h2 className="mb-4 font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Needs mapped to this Protocol
                    </h2>
                    <div className="text-sm text-gray-500 py-6 text-center">Implementation mapping coming soon.</div>
                </section>

            </div>
        </article>
    );
}