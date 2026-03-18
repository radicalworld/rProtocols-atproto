import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import TiptapEditor from "@/components/ui/TiptapEditor";

export default function SuiteEditorProfile({
    rootId: propRootId,
    parentNeedId,
    isNew = false,
    onClose
}: {
    rootId?: string;
    parentNeedId?: string | null;
    isNew?: boolean;
    onClose?: () => void;
} = {}) {
    const params = useParams();
    const rootId = propRootId || params.suiteId || (isNew ? "new" : "");
    
    // Suite editing is not yet strictly provisioned on the PDS adapter beyond creation layouts
    const release = useMemo(() => isNew ? { rootId: "new", version: "0.1.0", stage: "draft", title: "", description: "", purpose: "", language: "en", tags: [] } as any : null, [isNew]);
    const repo = useRepo();

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

    if (!isNew) return <div className="p-6">Suite editing not yet implemented.</div>;
    if (!isNew && !release) return <div className="p-6">No draft available.</div>;
    if (!isInitialized) return <div className="p-6 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Preparing editor…</div>;

    const canEdit = release?.stage === "draft" || release?.stage === "candidate";

    async function onPublish() {
        setSaving(true);
        try {
            if (isNew) {
                setTimeout(() => {}, 0);
                setMsg("✅ Suite created! (Routing not yet wired)");
            } else {
                setMsg("❌ Edit logic pending.");
            }
        } catch (e: any) {
            setMsg("❌ " + e.message);
        } finally {
            setSaving(false);
        }
    }

    async function onPromoteCandidate() {
        setMsg("❌ Promote logic pending for Suites.");
    }

    return (
        <div className="mx-auto max-w-3xl p-6 space-y-4">
            <header className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{isNew ? "Create Suite" : "Edit Suite"}</h1>
                    <div className="text-sm text-gray-500 mt-1">
                        {isNew ? (
                            <span className="flex items-center gap-2">
                                <span className="font-semibold text-gray-700">Root Context:</span> 
                                <span className="uppercase tracking-wider">{parentNeedId || "None"}</span>
                            </span>
                        ) : (
                            <>Editing version: <span className="font-mono">v{release?.version}</span></>
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

            <label className="block" htmlFor="suite-title">
                <div className="text-sm font-medium text-gray-700">Title {isNew ? "" : <span className="text-xs text-gray-400 font-normal ml-1">(Immutable via Lineage)</span>}</div>
                <input
                    id="suite-title"
                    name="title"
                    className={`mt-1 w-full rounded border p-2 ${!isNew ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    disabled={!isNew}
                />
            </label>

            <label className="block" htmlFor="suite-language">
                <div className="text-sm font-medium text-gray-700">Language</div>
                <input
                    id="suite-language"
                    name="language"
                    className="mt-1 w-full rounded border p-2"
                    placeholder="e.en"
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    disabled={!canEdit || saving}
                />
            </label>

            <label className="block" htmlFor="suite-tags">
                <div className="text-sm font-medium text-gray-700">Tags (comma separated)</div>
                <input
                    id="suite-tags"
                    name="tags"
                    className="mt-1 w-full rounded border p-2"
                    placeholder="tag1, tag2"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    disabled={!canEdit || saving}
                />
            </label>

            <label className="block" htmlFor="suite-purpose">
                <div className="text-sm font-medium text-gray-700">Purpose</div>
                <textarea
                    id="suite-purpose"
                    name="purpose"
                    className="mt-1 w-full rounded border p-2 h-24"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    disabled={!canEdit || saving}
                />
            </label>

            <label className="block" htmlFor="suite-description">
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