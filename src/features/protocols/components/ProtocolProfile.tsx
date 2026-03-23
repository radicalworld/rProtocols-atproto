import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Navigate, useMatch } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import type { Protocol } from "@/domain/types";
import { FollowEye } from "@/features/marks/FollowEye";
import { ProfileActions } from "@/features/marks/ProfileActions";
import { useFollowed } from "@/features/marks/useFollowed";
import { AdoptButton } from "@/features/marks/AdoptButton";
import { useAdopted } from "@/features/marks/useAdopted";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getRelease, latestVersion, listReleases } from "@/features/protocols/lib/releases";
import { protocolReleases } from "@/data/releases";
import { parseVersion, STAGE_DISPLAY_MAP, formatVersion } from "@/lib/version";
import { ProtocolVersionSwitcher } from "@/features/protocols/components/ProtocolVersionSwitcher";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Pencil } from "lucide-react";
import ProtocolEditorProfile from "@/features/protocols/components/ProtocolEditorProfile";
import { useSession } from "@/features/auth/SessionProvider";
import { VersionHeader } from "@/components/VersionHeader";
import { ProtocolIcon } from "@/components/icons/ProtocolIcon";
import { FoundationLink } from "@/components/FoundationLink";

export function ProtocolProfile({ protocolId: propId }: { protocolId?: string } = {}) {
    const { id: paramId = "", version: paramVersion } = useParams();
    const id = propId || paramId;
    const nav = useNavigate();
    const location = useLocation();
    const sectionId = location.pathname.split("/")[1] || "collaboration";
    const isEditing = location.pathname.endsWith("/edit");
    const repo = useRepo();
    const { session } = useSession();
    const [p, setP] = useState<Protocol | null>(null);
    const [notFound, setNotFound] = useState(false);
    
    // Live-binding state catching local draft changes rendering natively into static viewer panels concurrently.
    const [draftState, setDraftState] = useState<{tags: string[], uri: string} | null>(null);

    const handleDraftChange = useCallback((draft: { tags: string[], foundationRefURI: string }) => {
        setDraftState(prev => {
            const isSame = prev?.uri === draft.foundationRefURI && prev?.tags.join(",") === draft.tags.join(",");
            return isSame ? prev : { tags: draft.tags, uri: draft.foundationRefURI };
        });
    }, []);

    // Wire up dynamic tracking overlays to combat stale static JSON caches
    const { isFollowed } = useFollowed(p?.id ?? "", "protocol");
    const { adopted: isAdopted } = useAdopted(p?.id ?? "", "protocol");

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
            : paramVersion ?? p.version ?? latestVersion(p.id) ?? "1.0";

    const release = p.release ?? getRelease(p.id, selectedVersion);
    const versionString = p.release?.version ?? p.version ?? release?.version ?? selectedVersion ?? "1.0";
    const { major, minor } = parseVersion(versionString);

    // normalize stage names
    const rawStage = release?.stage;
    const computedStageFallback = major === 0 ? "draft" : "stable";

    const uiStage: "draft" | "candidate" | "stable" | "archived" =
        rawStage === "candidate"
            ? "candidate"
            : rawStage === "stable"
            ? "stable"
            : (rawStage ?? computedStageFallback) as any;

    const uiStageDisplay = STAGE_DISPLAY_MAP[uiStage] || uiStage;

    const body = p.body || release?.protocolBody || "";
    const canAdopt = release?.adoptEnabled ?? true;
    const versions = listReleases(p.id);
    
    // Intercept draft state directly overwriting static database representations
    const tags = isEditing && draftState ? draftState.tags : (release?.tags ?? (p as any).tags ?? []);
    
    const purpose = release?.purpose ?? p.summary ?? "";
    const date = release?.date ?? "";
    const language = release?.language || p.language || "en";
    
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
    
    const activeAttribution = attribution.length > 0 ? attribution : (did ? [{ name: "Publisher", did }] : []);
    
    const displayFoundationUri = isEditing && draftState ? draftState.uri : ((p as any).foundationRef?.uri || (release as any)?.foundationRef?.uri || "rp_suite-root-protocols");

    if (notFound) return <Navigate to="/404" replace />;

    if (!p) return <div className="mx-auto max-w-3xl p-6">Loading protocol…</div>;

    return (
        <article className="mx-auto max-w-[1200px] space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] lg:gap-8 animate-fade-in-up">
            
            {/* Left Column: Editor & Body */}
            <div className="space-y-6">
                {isEditing ? (
                    <ProtocolEditorProfile 
                        protocolId={p.id} 
                        onClose={() => nav(`/${sectionId}/protocols/${encodeURIComponent(p.id)}`)} 
                        onDraftChange={handleDraftChange}
                    />
                ) : (
                    <>
                        <header className="flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <ProtocolIcon className="text-gray-900 w-8 h-8 flex-shrink-0" />
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{p.title || release?.title}</h1>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mt-1">
                                <ProfileActions 
                                    subjectId={p.id} 
                                    kind="protocol"
                                    editUrl="edit" 
                                    newUrl={`/${sectionId}/protocols/new`}
                                    editTitle="Edit Protocol" 
                                    followLabel="Follow protocol" 
                                    showAdopt={true} 
                                    adoptDisabled={!canAdopt || versionString.startsWith("0.")} 
                                />
                            </div>
                            </div>

                            <VersionHeader 
                                versionString={versionString} 
                                uiStage={uiStage as any} 
                                uiStageDisplay={uiStageDisplay} 
                                language={language}
                                isPendingFork={p.familyEvent?.status === 'pending'}
                                switcher={
                                    <ProtocolVersionSwitcher 
                                        id={p.id} 
                                        currentVersion={versionString} 
                                        uiStage={uiStage as any}
                                        onChange={(v) => {
                                            const base = location.pathname.split("/versions/")[0];
                                            nav(`${base}/versions/${v}`);
                                        }}
                                    />
                                }
                            />
                        </header>

                        {(p.summary || release?.summary) && <p className="text-lg text-gray-600 leading-relaxed">{p.summary || release?.summary}</p>}

                        <FoundationLink foundationRef={{ uri: displayFoundationUri, cid: "" }} />

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
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Release</h3>
                                <p className="text-sm text-gray-900 leading-relaxed">
                                    v{formatVersion(versionString)}{date ? ` · ${date}` : ""} · {language}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Signals</h3>
                                <p className="text-sm text-gray-900 leading-relaxed">
                                    <span>Follows: {followCount}</span>
                                    <span className="ml-3">Adopts: {adoptCount}</span>
                                </p>
                            </div>
                        </div>

                        {!!tags.length && (
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

                        {(shortUrl || qrCode) && (
                            <div className="pt-2 border-t border-gray-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Share</h3>
                                {shortUrl && (
                                    <a href={`https://r.pro/${shortUrl}`} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 hover:underline mb-2">
                                        r.pro/{shortUrl}
                                    </a>
                                )}
                                {qrCode && (
                                    <img src={qrCode} alt="QR Code" className="w-24 h-24 rounded-lg border border-gray-200" />
                                )}
                            </div>
                        )}

                        {activeAttribution.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Attribution</h3>
                                <div className="flex flex-col gap-2">
                                    {activeAttribution.map((attr, idx) => (
                                        <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col">
                                            <div className="text-sm font-semibold text-gray-900">{attr.name}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5 break-all">{attr.did}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {related.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Related Protocols</h3>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {related.map(r => (
                                        <span key={r} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 font-medium tracking-wide">
                                            {r}
                                        </span>
                                    ))}
                                </div>
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