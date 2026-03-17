import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useProtocolEditor } from "@/features/protocols/hooks/useProtocolEditor";
import TiptapEditor from "@/components/ui/TiptapEditor";

export default function ProtocolEditorProfile({
    protocolId: propRootId,
    onClose
}: {
    protocolId?: string;
    onClose?: () => void;
} = {}) {
    const params = useParams();
    const rootId = propRootId || params.id || "";
    const { draft, loading, error, latest, updateDraft, promote } = useProtocolEditor(rootId);
    const [form, setForm] = useState({ title: "", summary: "", body: "", language: "", tags: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

    // initialize form when draft loads
    useEffect(() => {
        if (draft) {
            console.log("🛠️ DRAFT LOADED. Body length:", draft.body?.length, "Body prefix:", draft.body?.substring(0, 20));
            setForm({
                title: draft.title ?? "",
                summary: draft.summary ?? "",
                body: draft.body ?? "",
                language: draft.language ?? "en",
                tags: draft.tags ? draft.tags.join(", ") : "",
            });
            // Delay rendering the Tiptap component until this state is flushed
            // so it mounts with the correct initial `content` string.
            requestAnimationFrame(() => setIsInitialized(true));
        }
    }, [draft]);

    console.log("🖥️ RENDER. isInitialized:", isInitialized, "Form body length:", form.body?.length);

    if (loading) return <div className="p-6 text-sm text-gray-500">Loading editor…</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
    if (!draft) return <div className="p-6 text-sm text-gray-500">No draft available.</div>;
    if (!isInitialized) return <div className="p-6 text-sm text-gray-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Preparing editor…</div>;

    const canEdit = draft.stage === "draft" || draft.stage === "candidate";

    async function onSave() {
        setSaving(true);
        try {
            const changes = {
                ...form,
                tags: form.tags.split(",").map(t => t.trim()).filter(Boolean)
            };
            await updateDraft(draft.version, changes);
            setMsg("✅ Draft saved.");
        } catch (e: any) {
            setMsg("❌ " + e.message);
        } finally {
            setSaving(false);
        }
    }

    async function onPromoteCandidate() {
        setSaving(true);
        try {
            await promote(draft.version, "candidate", "Promoted via editor");
            setMsg("✅ Promoted to candidate.");
        } catch (e: any) {
            setMsg("❌ " + e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl p-6 space-y-4 animate-fade-in-up">
            <header className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Edit Protocol</h1>
                    <div className="text-sm text-gray-500 mt-1">
                        Editing version: <span className="font-mono">v{draft.version}</span>
                        {latest && latest !== draft.version ? ` (latest is v${latest})` : ""}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onSave}
                        disabled={!canEdit || saving}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={onPromoteCandidate}
                        disabled={!canEdit || saving}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-green-700 transition focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        Promote to Candidate
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="rounded p-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors ml-2">
                            Cancel
                        </button>
                    )}
                </div>
            </header>

            {!canEdit && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    This version is <b>{draft.stage}</b>. Create a new draft to edit content.
                </div>
            )}

            <label className="block" htmlFor="protocol-title">
                <div className="text-sm font-medium text-gray-700">Title</div>
                <input
                    id="protocol-title"
                    name="title"
                    className="mt-1 w-full text-base rounded border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    disabled={!canEdit || saving}
                />
            </label>

            <div className="flex gap-4">
                <label className="block flex-1" htmlFor="protocol-language">
                    <div className="text-sm font-medium text-gray-700">Language</div>
                    <input
                        id="protocol-language"
                        name="language"
                        className="mt-1 w-full text-base rounded border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="e.en"
                        value={form.language}
                        onChange={(e) => setForm({ ...form, language: e.target.value })}
                        disabled={!canEdit || saving}
                    />
                </label>

                <label className="block flex-1" htmlFor="protocol-tags">
                    <div className="text-sm font-medium text-gray-700">Tags (comma separated)</div>
                    <input
                        id="protocol-tags"
                        name="tags"
                        className="mt-1 w-full text-base rounded border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="tag1, tag2"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        disabled={!canEdit || saving}
                    />
                </label>
            </div>

            <label className="block" htmlFor="protocol-summary">
                <div className="text-sm font-medium text-gray-700">Summary</div>
                <textarea
                    id="protocol-summary"
                    name="summary"
                    className="mt-1 w-full text-base rounded border border-gray-300 p-2 h-20 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    disabled={!canEdit || saving}
                />
            </label>

            <label className="block" htmlFor="protocol-body">
                <div className="text-sm font-medium text-gray-700 mb-1">Body (Markdown)</div>
                <div className={!canEdit || saving ? "opacity-60 pointer-events-none" : ""}>
                    <TiptapEditor
                        content={form.body}
                        onChange={(value) => setForm({ ...form, body: value })}
                    />
                </div>
            </label>

            {/* Action buttons moved to header */}

            {msg && <div className="text-sm font-medium text-gray-600 bg-gray-50 border p-2 rounded">{msg}</div>}
        </div>
    );
}
