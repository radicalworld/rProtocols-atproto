import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProtocolBadge from "@/features/protocols/components/ProtocolBadge";
import { STAGE_DISPLAY_MAP, formatVersion } from "@/lib/version";
import { useRepo } from "@/domain/repo";
import { Protocol } from "@/domain/types";
import { parseVersion } from "@/lib/version";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Search, PlusCircle, Trash2, GripVertical } from "lucide-react";

export default function SuiteEditorProfile({
    rootId: propRootId,
    parentNeedId,
    isNew = false,
    onClose
}: {
    rootId?: string;
    parentNeedId?: string | null;
    isNew?: boolean;
    onClose?: (newId?: string) => void;
} = {}) {
    const params = useParams();
    const nav = useNavigate();
    const rootId = propRootId || params.suiteId || (isNew ? "new" : "");
    const repo = useRepo();
    
    const [fetchedDraft, setFetchedDraft] = useState<any>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            if (isNew || !rootId) return;
            const s = await repo.getSuite(rootId);
            if (!alive || !s) return;
            const protocols = await repo.getSuiteProtocols(s.lineageId);
            console.log("SuiteEditor Hydration Dump -> getSuite Object:", s);
            
            setFetchedDraft({
                lineageId: s.lineageId,
                version: (s as any).version || "1.0.0",
                stage: s.stage || "draft", 
                title: s.title,
                purpose: (s as any).purpose || (s as any).description || "",
                language: s.language,
                tags: s.tags,
                includeProtocols: protocols.map(p => ({ lineageId: p.id, title: p.title, slug: p.slug }))
            });
        })();
        return () => { alive = false; };
    }, [isNew, rootId, repo]);

    const release = useMemo(() => isNew ? { rootId: "new", version: "0.1.0", stage: "draft", title: "", description: "", purpose: "", language: "en", tags: [], includeProtocols: [] } as any : fetchedDraft, [isNew, fetchedDraft]);

    interface ProtocolLink {
        lineageId: string;
        title: string;
        slug: string;
    }

    const [form, setForm] = useState({ title: "", purpose: "", language: "", tags: "", protocols: [] as ProtocolLink[], changeDescription: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Save Modal & Protocol Selection state
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [targetVersionType, setTargetVersionType] = useState<"patch" | "minor" | "major">("patch");
    const [targetStage, setTargetStage] = useState<"draft" | "candidate" | "stable" | "deprecated">("draft");
    const [allProtocols, setAllProtocols] = useState<Protocol[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    // initialize form when release loads
    useEffect(() => {
        if (release) {
            setForm({
                title: release.title ?? "",
                purpose: release.purpose ?? "",
                language: release.language ?? "en",
                tags: release.tags ? (Array.isArray(release.tags) ? release.tags.join(", ") : String(release.tags)) : "",
                protocols: release.includeProtocols || [],
                changeDescription: ""
            });
            setTargetStage(release.stage as any);
            setTargetVersionType("patch");
            setIsInitialized(true);
        }
    }, [release]);

    // Fetch master protocol DB list for search selector
    useEffect(() => {
        repo.getProtocols().then(setAllProtocols);
    }, [repo]);

    const unmappedProtocols = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return allProtocols.filter(p => 
            !form.protocols.some(fp => fp.lineageId === p.id) &&
            (p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
        ).slice(0, 5); // Limit to top 5 hits
    }, [allProtocols, form.protocols, searchQuery]);

    const { major, minor, patch } = parseVersion(release?.version || "0.1.0");
    const nextPatch = `${major}.${minor}.${patch + 1}`;
    const nextMinor = `${major}.${minor + 1}.0`;
    const nextMajor = `${major + 1}.0.0`;

    const isStageBump = !isNew && release && targetStage !== release.stage;
    const isFirstActive = major === 0 && targetStage === 'stable';

    useEffect(() => {
        if (isStageBump && targetVersionType === 'patch') {
            setTargetVersionType(isFirstActive ? 'major' : 'minor');
        }
    }, [targetStage, isStageBump, isFirstActive, targetVersionType]);

    if (!isNew && !release) return <div className="p-6 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Fetching latest version context…</div>;
    if (!isInitialized) return <div className="p-6 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Preparing editor…</div>;

    const canEdit = release?.stage === "draft" || release?.stage === "candidate";
    const hasChanges = isNew ? form.title.trim().length > 0 : true;

    async function onUnifiedSave(action: "create" | "update", bumpLabel?: string) {
        setSaving(true);
        setMsg("");
        setIsSaveModalOpen(false);

        try {
            const mappedProtocols = form.protocols.map(p => ({ lineageId: p.lineageId }));
            
            if (isNew) {
                const sid = await repo.createSuite({
                    title: form.title || "Untitled Suite",
                    purpose: form.purpose,
                    tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
                    language: form.language || "en",
                    includeProtocols: mappedProtocols,
                    parentNeedLineageId: parentNeedId || undefined
                });

                // Track creation Follows safely via validated Lineage IDs
                const generated = await repo.getSuite(sid);
                if (generated) {
                    await repo.follow(generated.lineageId).catch(e => console.warn("Failed automatic self-follow:", e));
                    if (targetStage !== 'draft' && repo.promoteSuiteVersion) {
                        await repo.promoteSuiteVersion(generated.lineageId, "0.1.0", targetStage as any);
                    }
                }
                
                setMsg("✅ Suite published!");
                if (onClose) setTimeout(() => onClose(sid), 800);
            } else {
                let targetVer = release.version;
                if (targetVersionType === 'major') targetVer = nextMajor;
                else if (targetVersionType === 'minor') targetVer = nextMinor;
                else targetVer = nextPatch;

                await repo.updateSuiteDraft(release.lineageId, targetVer, {
                    title: form.title,
                    purpose: form.purpose,
                    tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
                    language: form.language,
                    includeProtocols: mappedProtocols
                });

                if (targetStage !== 'draft' && repo.promoteSuiteVersion) {
                    await repo.promoteSuiteVersion(release.lineageId, targetVer, targetStage as any);
                }

                setMsg("✅ Suite updated!");
                if (onClose) setTimeout(() => onClose(), 800);
            }
        } catch (e: any) {
            setMsg("❌ " + e.message);
        } finally {
            setSaving(false);
        }
    }



    const addProtocol = (p: Protocol) => {
        setForm({ ...form, protocols: [...form.protocols, { lineageId: p.lineageId || p.id, title: p.title, slug: p.slug }] });
        setSearchQuery("");
    };

    const removeProtocol = (lineageId: string) => {
        setForm({ ...form, protocols: form.protocols.filter(p => p.lineageId !== lineageId) });
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        if (!canEdit || saving) return;
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        if (!canEdit || saving) return;
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        if (!canEdit || saving) return;
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === dropIndex) return;

        const updated = [...form.protocols];
        const [moved] = updated.splice(draggedIdx, 1);
        updated.splice(dropIndex, 0, moved);
        setForm({ ...form, protocols: updated });
        setDraggedIdx(null);
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
    };

    return (
        <div className="mx-auto max-w-3xl p-6 space-y-6">
            <header className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{isNew ? "Create Suite" : "Edit Suite"}</h1>
                    <div className="text-sm font-medium text-gray-500 mt-2">
                        {isNew ? (
                            <span className="flex items-center gap-2">
                                <span className="text-gray-400">Context:</span> 
                                <span className="uppercase tracking-widest text-xs bg-gray-100 rounded-full px-2.5 py-0.5 border border-gray-200">{parentNeedId || "Network"}</span>
                            </span>
                        ) : (
                            <div className="flex items-center gap-2 mt-2">
                                <ProtocolBadge version={`v${formatVersion(release?.version)}`} stage="stable" />
                                <ProtocolBadge version={STAGE_DISPLAY_MAP[release?.stage as string] || release?.stage} stage={release?.stage as any} />
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 border border-gray-200 uppercase tracking-wider">
                                    {release?.language || "EN"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSaveModalOpen(true)}
                        disabled={!canEdit || saving || !hasChanges}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Publish
                    </button>
                    {onClose && (
                        <button onClick={() => onClose()} aria-label="Close Editor" className="rounded-lg p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors ml-1">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </header>

            {!canEdit && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    This version is currently marked as {release.stage.toUpperCase()}. Create a new draft branch to unlock semantic edits.
                </div>
            )}

            <label className="block" htmlFor="suite-title">
                <div className="text-sm font-medium text-gray-700">Title {isNew ? "" : <span className="text-xs text-gray-400 font-normal ml-1">(Locked)</span>}</div>
                <input
                    id="suite-title"
                    name="title"
                    className={`mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${!isNew ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    disabled={!isNew}
                />
            </label>

            <div className="flex gap-6">
                <label className="block flex-1" htmlFor="suite-language">
                    <div className="text-sm font-medium text-gray-700">Language <span className="text-xs text-gray-400 font-normal ml-1">(Locked)</span></div>
                    <input
                        id="suite-language"
                        name="language"
                        className="mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                        placeholder="en"
                        value={form.language}
                        onChange={(e) => setForm({ ...form, language: e.target.value })}
                        disabled={true}
                    />
                </label>

                <label className="block flex-1" htmlFor="suite-tags">
                    <div className="text-sm font-medium text-gray-700">Tags (comma separated)</div>
                    <input
                        id="suite-tags"
                        name="tags"
                        className="mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="tag1, tag2"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        disabled={!canEdit || saving}
                    />
                </label>
            </div>

            <label className="block" htmlFor="suite-purpose">
                <div className="text-sm font-medium text-gray-700">Purpose</div>
                <textarea
                    id="suite-purpose"
                    name="purpose"
                    className="mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 h-24 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    disabled={!canEdit || saving}
                />
            </label>

            <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-700 mb-3">Protocol Requirements</div>

                {canEdit && (
                    <div className="mb-4 relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search repository for protocols to add..."
                                className="w-full text-sm rounded-xl border border-gray-300 pl-9 pr-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        {unmappedProtocols.length > 0 && (
                            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
                                {unmappedProtocols.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addProtocol(p)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{p.title}</div>
                                            <div className="text-xs text-gray-500 truancate max-w-[200px]">{p.summary || "No summary provided"}</div>
                                        </div>
                                        <PlusCircle className="w-5 h-5 text-blue-600" />
                                    </button>
                                ))}
                            </div>
                        )}
                        {searchQuery.trim() && unmappedProtocols.length === 0 && (
                            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 text-sm text-center text-gray-500">
                                No new protocols found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    {form.protocols.map((p, idx) => (
                        <div 
                            key={p.lineageId} 
                            draggable={canEdit && !saving}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm transition-all ${canEdit && !saving ? "cursor-grab active:cursor-grabbing hover:border-gray-300" : ""} ${draggedIdx === idx ? "opacity-40 scale-[0.98]" : ""}`}
                        >
                            <div className="flex items-center gap-3">
                                {canEdit && !saving && (
                                    <div className="flex shrink-0 items-center justify-center p-1 hover:bg-gray-100 rounded text-gray-400 cursor-grab active:cursor-grabbing text-opacity-50 hover:text-opacity-100">
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-medium text-gray-900 leading-tight">{p.title || p.slug}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{p.lineageId}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => removeProtocol(p.lineageId)}
                                disabled={!canEdit || saving}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {form.protocols.length === 0 && (
                        <div className="text-sm text-gray-500 italic p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                            No protocols linked to this suite yet.
                        </div>
                    )}
                </div>
            </div>

            {msg && <div className="text-sm font-medium text-gray-600 bg-gray-50 border p-3 rounded-xl shadow-sm">{msg}</div>}

            <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Publish Changes to This Suite</DialogTitle>
                        <DialogDescription>Select how you want to release these changes.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-900">What changed?</label>
                            {isNew ? (
                                <div className="p-3 border rounded-lg border-blue-500 bg-blue-50 text-blue-900">
                                    <span className="block text-sm font-medium">Initial Publish (v0.1.0)</span>
                                    <span className="block text-xs text-blue-700/80 mt-1">This will index the Suite definition comprising {form.protocols.length} protocol mappings.</span>
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
                                    {isFirstActive && (
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
                                                <span className="block text-sm font-medium text-amber-900">Official Release (v{nextMajor})</span>
                                                <span className="block text-xs text-amber-700/80">Promotes this Suite mapping to an active, structurally certified component.</span>
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
                                onClick={() => onUnifiedSave(isNew ? "create" : "update")}
                                disabled={saving}
                                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {saving ? "Publishing..." : "Confirm & Publish"}
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
    );
}