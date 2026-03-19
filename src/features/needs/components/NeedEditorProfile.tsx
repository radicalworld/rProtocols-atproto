import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNeed } from "@/features/needs/hooks/useNeed";
import {
  getNeedRelease,
  primeNeedReleases,
  latestNeedVersion,
  type NeedRelease,
} from "@/features/needs/lib/releases";
import { useRepo } from "@/domain/repo";
import TiptapEditor from "@/components/ui/TiptapEditor";
import NeedBadge from "@/features/needs/components/NeedBadge";
import { STAGE_DISPLAY_MAP, formatVersion } from "@/lib/version";

export default function NeedEditorProfile({
    rootId: propRootId,
    parentLineageId,
    isNew = false,
    onClose
}: {
    rootId?: string;
    parentLineageId?: string | null;
    isNew?: boolean;
    onClose?: () => void;
} = {}) {
    const params = useParams();
    const rootId = propRootId || params.lineageId || (isNew ? "new" : "");
    const { release: fetchedRelease, loading, error, latest, updateDraft, promote } = useNeed(isNew ? undefined : rootId);
    
    // Fallback to empty default state immediately if isNew
    const release = useMemo(() => isNew ? { rootId: "new", version: "0.1.0", stage: "draft", title: "", description: "", purpose: "", language: "en", tags: [] } as any : fetchedRelease, [isNew, fetchedRelease]);
    const repo = useRepo();
    const nav = useNavigate();

    const [form, setForm] = useState({ title: "", description: "", purpose: "", language: "", tags: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

    // initialize form when release loads
    useEffect(() => {
        if (release) {
            setForm({
                title: release.title ?? "",
                description: release.description ?? "",
                purpose: release.purpose ?? "",
                language: release.language ?? "en",
                tags: release.tags ? release.tags.join(", ") : "",
            });
            // Delay rendering the Tiptap component until this state is flushed
            requestAnimationFrame(() => setIsInitialized(true));
        }
    }, [release]);

    if (!isNew && loading) return <div className="p-6">Loading editor…</div>;
    if (!isNew && error) return <div className="p-6 text-red-600">{error}</div>;
    if (!release) return <div className="p-6">No draft available.</div>;
    if (!isInitialized) return <div className="p-6 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Preparing editor…</div>;

    const canEdit = release.stage === "draft" || release.stage === "candidate";

    async function onPublish() {
        setSaving(true);
        try {
            if (isNew) {
                const nid = await repo.createNeed({
                    title: form.title || "Untitled Need",
                    description: form.description || "",
                    purpose: "",
                    language: "en",
                    tags: [],
                    parentLineageId: parentLineageId || undefined
                });
                
                // Automatically set the author to follow their new creation
                const gen = await repo.getNeedByLineageId(nid) || await (repo as any).getNeedByVersion(nid, "1.0");
                if (gen) await repo.follow(gen.lineageId);
                
                setMsg(`✅ Need created! Redirecting...`);
                
                const targetUrl = parentLineageId 
                    ? `/${parentLineageId}/needs/${nid}` 
                    : `/needs/${nid}`;
                
                setTimeout(() => nav(targetUrl), 200);
            } else {
                const changes = {
                    ...form,
                    tags: "tags" in form && typeof form.tags === "string" ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : []
                };
                await updateDraft(release.version, changes);
                setMsg("✅ Published.");
            }
        } catch (e: any) {
            setMsg("❌ " + e.message);
        } finally {
            setSaving(false);
        }
    }

    async function onPromoteCandidate() {
        setSaving(true);
        try {
            await promote(release.version, "candidate", "Promoted via editor");
            setMsg("✅ Promoted to candidate.");
        } catch (e: any) {
            setMsg("❌ " + e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl p-6 space-y-4">
            <header className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{isNew ? "Create Need" : "Edit Need"}</h1>
                    <div className="text-sm text-gray-500 mt-1">
                        {isNew ? (
                            <span className="flex items-center gap-2">
                                <span className="font-semibold text-gray-700">Parent Context:</span> 
                                <span className="uppercase tracking-wider">{parentLineageId || "None"}</span>
                            </span>
                        ) : (
                            <div className="flex items-center gap-2 mt-2">
                                <NeedBadge version={`v${formatVersion(release?.version)}`} stage="stable" />
                                <NeedBadge version={STAGE_DISPLAY_MAP[release?.stage as string] || release?.stage} stage={release?.stage as any} />
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 border border-gray-200 uppercase tracking-wider">
                                    {release?.language || "EN"}
                                </span>
                                {latest && latest !== release.version && <span className="ml-2 text-xs italic text-gray-500">(latest is v{formatVersion(latest)})</span>}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPublish}
                        disabled={!canEdit || saving}
                        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        Publish
                    </button>
                    {!isNew && (
                        <button
                            onClick={onPromoteCandidate}
                            disabled={!canEdit || saving}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-green-700 transition disabled:opacity-50"
                        >
                            Promote to Candidate
                        </button>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="rounded p-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors ml-2">
                            Cancel
                        </button>
                    )}
                </div>
            </header>

            {!canEdit && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    This version is <b>{release.stage}</b>. Create a new draft to edit content.
                </div>
            )}

            <label className="block" htmlFor="need-title">
                <div className="text-sm font-medium text-gray-700">Title {isNew ? "" : <span className="text-xs text-gray-400 font-normal ml-1">(Locked)</span>}</div>
                <input
                    id="need-title"
                    name="title"
                    className={`mt-1 w-full rounded border p-2 ${!isNew ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    disabled={!isNew}
                />
            </label>

            <label className="block" htmlFor="need-language">
                <div className="text-sm font-medium text-gray-700">Language</div>
                <input
                    id="need-language"
                    name="language"
                    className="mt-1 w-full rounded border p-2"
                    placeholder="e.en"
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    disabled={!canEdit || saving}
                />
            </label>

            <label className="block" htmlFor="need-tags">
                <div className="text-sm font-medium text-gray-700">Tags (comma separated)</div>
                <input
                    id="need-tags"
                    name="tags"
                    className="mt-1 w-full rounded border p-2"
                    placeholder="tag1, tag2"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    disabled={!canEdit || saving}
                />
            </label>

            <label className="block" htmlFor="need-purpose">
                <div className="text-sm font-medium text-gray-700">Purpose</div>
                <textarea
                    id="need-purpose"
                    name="purpose"
                    className="mt-1 w-full rounded border p-2 h-24"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    disabled={!canEdit || saving}
                />
            </label>

            <label className="block" htmlFor="need-description">
                <div className="text-sm font-medium text-gray-700 mb-1">Description (Markdown)</div>
                <div className={!canEdit || saving ? "opacity-60 pointer-events-none" : ""}>
                    <TiptapEditor
                        content={form.description}
                        onChange={(value) => setForm({ ...form, description: value })}
                    />
                </div>
            </label>

            {/* Action buttons moved to header */}

            {msg && <div className="text-sm text-gray-500">{msg}</div>}
        </div>
    );
}