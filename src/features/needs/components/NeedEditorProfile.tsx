import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useNeed } from "@/features/needs/hooks/useNeed";
import {
  getNeedRelease,
  primeNeedReleases,
  latestNeedVersion,
  type NeedRelease,
} from "@/features/needs/lib/releases";
import { useRepo } from "@/domain/repo";
import TiptapEditor from "@/components/ui/TiptapEditor";
import { X } from "lucide-react";
import { formatVersion, STAGE_DISPLAY_MAP, parseVersion } from "@/lib/version";
import { VersionHeader } from "@/components/VersionHeader";
import { NeedIcon } from "@/components/icons/NeedIcon";
import { FoundationSelector } from "@/components/FoundationSelector";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

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

    const [form, setForm] = useState({ title: "", description: "", purpose: "", language: "", tags: "", foundationRefURI: "suite-root-protocols", changeDescription: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

    // Save Modal & Need Selection state
    const [searchParams] = useSearchParams();
    const isFork = searchParams.get("fork") === "true";
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [targetVersionType, setTargetVersionType] = useState<"patch" | "minor" | "major">(isFork ? "major" : "patch");
    const [targetStage, setTargetStage] = useState<"draft" | "candidate" | "stable" | "deprecated">("draft");

    // initialize form when release loads
    useEffect(() => {
        if (release) {
            setForm({
                title: release.title ?? "",
                description: release.description ?? "",
                purpose: release.purpose ?? "",
                language: release.language ?? "en",
                tags: release.tags ? release.tags.join(", ") : "",
                foundationRefURI: release.foundationRef?.uri || "suite-root-protocols",
                changeDescription: ""
            });
            setTargetStage(release.stage as any);
            setTargetVersionType(isFork ? "major" : "patch");
            // Delay rendering the Tiptap component until this state is flushed
            requestAnimationFrame(() => setIsInitialized(true));
        }
    }, [release]);

    // Clone parent data natively if Genesis Fork
    const forkFrom = searchParams.get("forkFrom");
    useEffect(() => {
        let alive = true;
        (async () => {
            if (isNew && forkFrom) {
                const parent = await repo.getNeedByLineageId(decodeURIComponent(forkFrom));
                if (!alive || !parent) return;
                setForm(prev => ({
                    ...prev,
                    title: parent.title || "",
                    description: parent.description || "",
                    purpose: parent.purpose || "",
                    language: parent.language || "en",
                    tags: parent.tags ? (Array.isArray(parent.tags) ? parent.tags.join(", ") : parent.tags) : "",
                    foundationRefURI: parent.foundationRef?.uri || "suite-root-protocols",
                }));
            }
        })();
        return () => { alive = false; };
    }, [isNew, forkFrom, repo]);

    const { major, minor, patch } = parseVersion(release?.version || "0.1.0");
    const nextPatch = `${major}.${minor}.${patch + 1}`;
    const nextMinor = `${major}.${minor + 1}.0`;
    const nextMajor = `${major + 1}.0.0`;

    const isStageBump = !isNew && release && targetStage !== release.stage;
    const isFirstActive = major === 0 && targetStage === 'stable';
    const showMajor = isFirstActive || isFork;

    useEffect(() => {
        if (isStageBump && targetVersionType === 'patch') {
            setTargetVersionType(isFirstActive ? 'major' : 'minor');
        }
    }, [targetStage, isStageBump, isFirstActive, targetVersionType]);

    if (!isNew && loading) return <div className="p-6">Loading editor…</div>;
    if (!isNew && error) return <div className="p-6 text-red-600">{error}</div>;
    if (!release) return <div className="p-6">No draft available.</div>;
    if (!isInitialized) return <div className="p-6 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Preparing editor…</div>;

    const canEdit = release.stage === "draft" || release.stage === "candidate";
    const hasChanges = isNew ? form.title.trim().length > 0 : true;

    async function onUnifiedSave() {
        setSaving(true);
        setMsg("");
        setIsSaveModalOpen(false);
        try {
            if (isNew) {
                const nid = await repo.createNeed({
                    title: form.title || "Untitled Need",
                    description: form.description,
                    purpose: form.purpose,
                    language: form.language || "en",
                    tags: Array.isArray(form.tags) ? form.tags : form.tags.split(",").map(t => t.trim()).filter(Boolean),
                    foundationRef: { uri: form.foundationRefURI },
                    parentLineageId: parentLineageId || undefined,
                    forkFrom: forkFrom || undefined
                } as any);
                
                // Automatically set the author to follow their new creation
                const gen = await repo.getNeedByLineageId(nid) || await (repo as any).getNeedByVersion(nid, "1.0");
                if (gen) {
                    await repo.follow(gen.lineageId, "need").catch(e => console.warn("Failed automatic self-follow:", e));
                    if (targetStage !== 'draft' && repo.promoteNeedVersion) {
                        await repo.promoteNeedVersion(gen.lineageId, "0.1.0", targetStage as any);
                    }
                }
                
                setMsg(`✅ Need published! Redirecting...`);
                
                const targetUrl = parentLineageId 
                    ? `/${parentLineageId}/needs/${nid}` 
                    : `/needs/${nid}`;
                
                setTimeout(() => nav(targetUrl), 200);
            } else {
                let targetVer = release.version;
                if (targetVersionType === 'major') targetVer = nextMajor;
                else if (targetVersionType === 'minor') targetVer = nextMinor;
                else targetVer = nextPatch;

                const changes = {
                    ...form,
                    tags: "tags" in form && typeof form.tags === "string" ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
                    foundationRef: { uri: form.foundationRefURI }
                };
                await updateDraft(targetVer, changes);
                
                if (targetStage !== 'draft' && repo.promoteNeedVersion) {
                    await promote(targetVer, targetStage as any, form.changeDescription);
                }

                setMsg("✅ Published.");
                if (onClose) setTimeout(() => onClose(), 800);
            }
        } catch (e: any) {
            setMsg("❌ " + e.message);
        } finally {
            setSaving(false);
        }
    }


    return (
        <div className="p-6 space-y-4">
            <header className="flex flex-col gap-4 border-b pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <NeedIcon className="text-gray-900 w-8 h-8 flex-shrink-0 mt-0.5" />
                        <div>
                            <h1 className="text-2xl font-semibold">{isNew ? "Create Need" : "Edit Need"}</h1>
                            {isNew && (
                            <div className="text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Parent Context:</span> 
                                    <span className="uppercase tracking-wider">{parentLineageId || "None"}</span>
                                </span>
                            </div>
                        )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSaveModalOpen(true)}
                            disabled={!canEdit || saving || !hasChanges || !form.title.trim()}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                        >
                            Publish
                        </button>
                        {onClose && (
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {!isNew && (
                    <div className="-mb-2">
                        <VersionHeader 
                            versionString={release?.version!}
                            uiStageDisplay={STAGE_DISPLAY_MAP[release?.stage as string] || release?.stage}
                            uiStage={release?.stage as any}
                            language={release?.language || "en"}
                        />
                    </div>
                )}
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
                    className={`mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${!isNew ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    disabled={!isNew}
                />
            </label>

            <div className="flex gap-6">
                <label className="block w-[140px] shrink-0" htmlFor="need-language">
                    <div className="text-sm font-medium text-gray-700">Language <span className="text-xs text-gray-400 font-normal ml-1">(Locked)</span></div>
                    <input
                        id="need-language"
                        name="language"
                        className="mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50 text-gray-400 cursor-not-allowed"
                        value={form.language}
                        onChange={(e) => setForm({ ...form, language: e.target.value })}
                        disabled={true}
                    />
                </label>

                <label className="block flex-1" htmlFor="need-tags">
                    <div className="text-sm font-medium text-gray-700">Tags (comma separated)</div>
                    <input
                        id="need-tags"
                        name="tags"
                        className="mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="tag1, tag2"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        disabled={!canEdit || saving}
                    />
                </label>
            </div>

            <label className="block" htmlFor="need-purpose">
                <div className="text-sm font-medium text-gray-700">Purpose</div>
                <textarea
                    id="need-purpose"
                    name="purpose"
                    className="mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[100px] resize-y"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    disabled={!canEdit || saving}
                />
            </label>

            <FoundationSelector 
                value={form.foundationRefURI} 
                onChange={(uri) => setForm({ ...form, foundationRefURI: uri })}
                disabled={!canEdit || saving} 
            />

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

            {msg && <div className="text-sm font-medium text-gray-600 bg-gray-50 border p-3 rounded-xl shadow-sm">{msg}</div>}

            <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Publish Changes to This Need</DialogTitle>
                        <DialogDescription>Select how you want to release these changes.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-900">What changed?</label>
                            {isNew ? (
                                <div className="p-3 border rounded-lg border-blue-500 bg-blue-50 text-blue-900">
                                    <span className="block text-sm font-medium">Initial Publish (v0.1.0)</span>
                                    <span className="block text-xs text-blue-700/80 mt-1">This will index the Need definition.</span>
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
                                                {isStageBump ? "Disabled. Readiness changes require a minor or major bump." : "Append a new structural patch version. No prior records are overwritten."}
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
                                            <span className="block text-xs text-gray-500">Append a new minor feature block layout. No prior records are overwritten.</span>
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
                                                <span className="block text-xs text-amber-700/80">Creates a distinct, independent branch of this need.</span>
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

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setIsSaveModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onUnifiedSave()}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {saving ? "Publishing..." : "Confirm Publish"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}