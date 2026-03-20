import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useProtocolEditor } from "@/features/protocols/hooks/useProtocolEditor";
import { useRepo } from "@/domain/repo";
import TiptapEditor from "@/components/ui/TiptapEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { X, UserCircle2 } from "lucide-react";
import { formatVersion, STAGE_DISPLAY_MAP } from "@/lib/version";
import { VersionHeader } from "@/components/VersionHeader";
import { ProtocolIcon } from "@/components/icons/ProtocolIcon";

export default function ProtocolEditorProfile({
    protocolId: propRootId,
    parentNeedId,
    isNew = false,
    onClose
}: {
    protocolId?: string;
    parentNeedId?: string | null;
    isNew?: boolean;
    onClose?: () => void;
} = {}) {
    const params = useParams();
    const rootId = propRootId || params.id || (isNew ? "new" : "");
    // If we're creating a new protocol, we DO NOT fetch the draft from the backend.
    const { draft: fetchedDraft, loading, error, latest, publishProtocol } = useProtocolEditor(isNew ? undefined : rootId);
    const repo = useRepo();
    const nav = useNavigate();
    
    // Fallback to a blank state immediately if 'isNew' is enforced
    const draft = useMemo(() => isNew ? { rootId: "new", version: "0.1.0", stage: "draft", title: "", summary: "", body: "", language: "en", tags: [] } as any : fetchedDraft, [isNew, fetchedDraft]);

    const [form, setForm] = useState({ title: "", summary: "", body: "", language: "", tags: "", changeDescription: "" });
    const [saving, setSaving] = useState(false);
    
    // Modal State
    const [searchParams] = useSearchParams();
    const isFork = searchParams.get("fork") === "true";
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [targetVersionType, setTargetVersionType] = useState<"patch" | "minor" | "major">(isFork ? "major" : "patch");
    const [targetStage, setTargetStage] = useState<"draft" | "candidate" | "stable" | "deprecated">("draft");

    const [msg, setMsg] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

    // initialize form when draft loads
    useEffect(() => {
        if (draft) {
            setForm({
                title: draft.title ?? "",
                summary: draft.summary ?? "",
                body: draft.body ?? "",
                language: draft.language ?? "en",
                tags: draft.tags ? (Array.isArray(draft.tags) ? draft.tags.join(", ") : draft.tags) : "",
                changeDescription: "" // Reset per modal publish open
            });
            // Setup defaults for Modal
            setTargetStage(draft.stage as any);
            setTargetVersionType(isFork ? "major" : "patch");

            requestAnimationFrame(() => setIsInitialized(true));
        }
    }, [draft, isFork]);

    // Clone parent data natively if Genesis Fork
    const forkFrom = searchParams.get("forkFrom");
    useEffect(() => {
        let alive = true;
        (async () => {
            if (isNew && forkFrom) {
                const parent = await repo.getProtocol(decodeURIComponent(forkFrom));
                if (!alive || !parent) return;
                setForm(prev => ({
                    ...prev,
                    title: parent.title || "",
                    summary: parent.summary || "",
                    body: parent.body || "",
                    language: parent.language || "en",
                    tags: parent.tags ? (Array.isArray(parent.tags) ? parent.tags.join(", ") : parent.tags) : "",
                }));
            }
        })();
        return () => { alive = false; };
    }, [isNew, forkFrom, repo]);

    // Derived Versions for Modal
    const currentVer = draft?.version || "1.0.0";
    const parts = currentVer.split('.');
    let major = parseInt(parts[0], 10);
    if (isNaN(major)) major = 1;
    const minor = parseInt(parts[1], 10) || 0;
    const patch = parseInt(parts[2], 10) || 0;
    
    const nextPatch = `${major}.${minor}.${patch + 1}`;
    const nextMinor = `${major}.${minor + 1}.0`;
    const nextMajor = `${major + 1}.0.0`;

    const isStageBump = !isNew && draft && targetStage !== draft.stage;
    const isFirstActive = major === 0 && targetStage === 'stable';
    const showMajor = isFirstActive || isFork;

    useEffect(() => {
        if (isStageBump && targetVersionType === 'patch') {
            setTargetVersionType(isFirstActive ? 'major' : 'minor');
        }
    }, [targetStage, isStageBump, isFirstActive, targetVersionType]);

    if (!isNew && loading) return <div className="p-6 text-sm text-gray-500">Loading editor…</div>;
    if (!isNew && error) return <div className="p-6 text-red-600">{error}</div>;
    if (!draft) return <div className="p-6 text-sm text-gray-500">No protocol layout available.</div>;
    if (!isInitialized) return <div className="p-6 text-sm text-gray-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Preparing editor…</div>;

    const canEdit = draft.stage === "draft" || draft.stage === "candidate";

    const hasChanges = draft ? (
        form.title !== (draft.title ?? "") ||
        form.summary !== (draft.summary ?? "") ||
        form.body !== (draft.body ?? "") ||
        form.language !== (draft.language ?? "en") ||
        form.tags !== (draft.tags ? draft.tags.join(", ") : "")
    ) : false;

    async function onUnifiedSave() {
        setSaving(true);
        try {
            const currentContent = {
                title: form.title,
                summary: form.summary,
                body: form.body,
                language: form.language,
                tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
                changeDescription: form.changeDescription || undefined
            };
            
            if (isNew) {
                const pid = await repo.createProtocol({
                    title: form.title || "Untitled Protocol",
                    summary: form.summary,
                    body: form.body,
                    tags: Array.isArray(form.tags) ? form.tags : form.tags.split(",").map(t => t.trim()).filter(Boolean),
                    language: form.language || "en",
                    forkFrom: forkFrom || undefined
                });
                if (parentNeedId) {
                    await repo.linkProtocolServesNeed(pid, parentNeedId);
                }
                
                // Automatically set the author to follow their new creation
                const gen = await repo.getProtocol(pid);
                if (gen) await repo.follow(gen.lineageId);
                
                setIsSaveModalOpen(false);
                setMsg("✅ Protocol created! Redirecting...");
                
                // Reconstruct the nested UI URL natively to keep them inside the sidebar shell
                const targetUrl = parentNeedId 
                    ? `/${parentNeedId}/${params.suiteId ? `suites/${params.suiteId}/` : ''}protocols/${pid}`
                    : `/protocol/${pid}`;
                
                setTimeout(() => nav(targetUrl), 200);
            } else {
                await publishProtocol(targetVersionType, targetStage, currentContent);
                setIsSaveModalOpen(false);
                if (onClose) {
                    onClose();
                } else {
                    setMsg("✅ Successfully published!");
                }
            }
        } catch (e: any) {
            setMsg("❌ " + e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="p-6 space-y-4 animate-fade-in-up">
            <header className="flex flex-col gap-4 border-b pb-4">
                <div className="mx-auto max-w-3xl w-full flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <ProtocolIcon className="text-gray-900 w-8 h-8 flex-shrink-0 mt-0.5" />
                        <div>
                            <h1 className="text-2xl font-semibold">{isNew ? "Create Protocol" : "Edit Protocol"}</h1>
                            {isNew && (
                                <div className="text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-700">Parent Context:</span> 
                                        <span className="uppercase tracking-wider">{parentNeedId || "None"}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSaveModalOpen(true)}
                            disabled={!hasChanges}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                        >
                            {isNew ? "Create" : "Publish"}
                        </button>
                        {onClose && (
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {!isNew && (
                    <div className="mx-auto max-w-3xl -mb-2">
                        <VersionHeader 
                            versionString={draft.version!}
                            uiStageDisplay={STAGE_DISPLAY_MAP[targetStage as string] || targetStage}
                            uiStage={targetStage}
                            language={form.language}
                        />
                    </div>
                )}
            </header>

            <label className="mx-auto max-w-3xl block" htmlFor="protocol-title">
                <div className="text-sm font-medium text-gray-700">Title {isNew ? "" : <span className="text-xs text-gray-400 font-normal ml-1">(Locked)</span>}</div>
                <input
                    id="protocol-title"
                    name="title"
                    className={`mt-1 w-full text-base rounded border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${!isNew ? "bg-gray-50 text-gray-600 cursor-not-allowed" : ""}`}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    disabled={!isNew}
                />
            </label>

            <div className="flex gap-4">
                <label className="block flex-1" htmlFor="protocol-language">
                    <div className="text-sm font-medium text-gray-700">Language <span className="text-xs text-gray-400 font-normal ml-1">(Locked)</span></div>
                    <input
                        id="protocol-language"
                        name="language"
                        className="mt-1 w-full text-base rounded border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50 text-gray-600 cursor-not-allowed"
                        placeholder="en"
                        value={form.language}
                        onChange={(e) => setForm({ ...form, language: e.target.value })}
                        disabled={true}
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

            <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Publish Changes to This Protocol</DialogTitle>
                        <DialogDescription>Select how you want to release these changes.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-900">What changed?</label>
                            {isNew ? (
                                <div className="p-3 border rounded-lg border-blue-500 bg-blue-50 text-blue-900">
                                    <span className="block text-sm font-medium">Initial Publish (v0.1.0)</span>
                                    <span className="block text-xs text-blue-700/80 mt-1">This will create the very first draft version of this protocol.</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    <label className={`flex items-center p-3 border rounded-lg transition ${targetVersionType === 'patch' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'} ${isStageBump ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                                        <input 
                                            type="radio" 
                                            name="versionType" 
                                            value="patch"
                                            checked={targetVersionType === 'patch'} 
                                            onChange={() => setTargetVersionType('patch')}
                                            disabled={isStageBump}
                                            className="h-4 w-4 text-blue-600 disabled:opacity-50" 
                                        />
                                        <span className="ml-3 block">
                                            <span className="block text-sm font-medium">Small fix or cleanup (v{nextPatch})</span>
                                            <span className="block text-xs text-gray-500">
                                                {isStageBump ? "Disabled. Readiness changes require a minor or major bump." : "Typos, wording, or formatting—no change in meaning."}
                                            </span>
                                        </span>
                                    </label>
                                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${targetVersionType === 'minor' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                                        <input 
                                            type="radio" 
                                            name="versionType" 
                                            value="minor"
                                            checked={targetVersionType === 'minor'} 
                                            onChange={() => setTargetVersionType('minor')}
                                            className="h-4 w-4 text-blue-600" 
                                        />
                                        <span className="ml-3 block">
                                            <span className="block text-sm font-medium">Improvement or clarification (v{nextMinor})</span>
                                            <span className="block text-xs text-gray-500">Adds detail or improves the protocol without changing its direction.</span>
                                        </span>
                                    </label>
                                    {showMajor && (
                                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${targetVersionType === 'major' ? 'border-amber-500 bg-amber-50' : 'hover:bg-gray-50'}`}>
                                            <input 
                                                type="radio" 
                                                name="versionType" 
                                                value="major"
                                                checked={targetVersionType === 'major'} 
                                                onChange={() => setTargetVersionType('major')}
                                                className="h-4 w-4 text-amber-600" 
                                            />
                                            <span className="ml-3 block">
                                                <span className="block text-sm font-medium text-amber-900">New Version (v{nextMajor})</span>
                                                <span className="block text-xs text-amber-700/80">Creates a distinct, independent branch of this protocol.</span>
                                            </span>
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-900">Readiness</label>
                            <div className="flex p-1 bg-gray-100 rounded-lg">
                                <button 
                                    onClick={() => setTargetStage('draft')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${targetStage === 'draft' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >Evolving</button>
                                <button 
                                    onClick={() => !isNew && setTargetStage('candidate')}
                                    disabled={isNew}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${targetStage === 'candidate' ? 'bg-white shadow-sm text-amber-700' : 'text-gray-500 hover:text-gray-700'} ${isNew ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >In Review</button>
                                <button 
                                    onClick={() => !isNew && setTargetStage('stable')}
                                    disabled={isNew}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${targetStage === 'stable' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'} ${isNew ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >Active</button>
                                <button 
                                    onClick={() => !isNew && setTargetStage('deprecated')}
                                    disabled={isNew}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${targetStage === 'deprecated' ? 'bg-white shadow-sm text-red-700' : 'text-gray-500 hover:text-gray-700'} ${isNew ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >Retired</button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-900" htmlFor="change-note">Add a note (optional)</label>
                            <p className="text-xs text-gray-500 mt-1 mb-2">Help others understand what’s different.</p>
                            <textarea
                                id="change-note"
                                className="w-full text-sm rounded-lg border border-gray-300 p-3 h-20 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                placeholder="..."
                                value={form.changeDescription}
                                onChange={(e) => setForm({ ...form, changeDescription: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <button 
                            onClick={() => setIsSaveModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >Cancel</button>
                        <button 
                            onClick={onUnifiedSave}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                        >
                            {saving ? "Publishing..." : "Publish Changes"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
