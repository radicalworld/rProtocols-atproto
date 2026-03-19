import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRepo } from "@/domain/repo";
import { parseVersion } from "@/lib/version";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Search, PlusCircle, Trash2, GripVertical } from "lucide-react";
export default function SuiteEditorProfile({ rootId: propRootId, parentNeedId, isNew = false, onClose } = {}) {
    const params = useParams();
    const nav = useNavigate();
    const rootId = propRootId || params.suiteId || (isNew ? "new" : "");
    const repo = useRepo();
    const [fetchedDraft, setFetchedDraft] = useState(null);
    useEffect(() => {
        let alive = true;
        (async () => {
            if (isNew || !rootId)
                return;
            const s = await repo.getSuite(rootId);
            if (!alive || !s)
                return;
            const protocols = await repo.getSuiteProtocols(s.lineageId);
            setFetchedDraft({
                lineageId: s.lineageId,
                version: "1.0.0", // mock semantic release format map
                stage: "draft",
                title: s.title,
                purpose: s.purpose,
                language: s.language,
                tags: s.tags,
                includeProtocols: protocols.map(p => ({ lineageId: p.id, title: p.title, slug: p.slug }))
            });
        })();
        return () => { alive = false; };
    }, [isNew, rootId, repo]);
    const release = useMemo(() => isNew ? { rootId: "new", version: "0.1.0", stage: "draft", title: "", description: "", purpose: "", language: "en", tags: [], includeProtocols: [] } : fetchedDraft, [isNew, fetchedDraft]);
    const [form, setForm] = useState({ title: "", purpose: "", language: "", tags: "", protocols: [], changeDescription: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);
    // Save Modal & Protocol Selection state
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [targetVersionType, setTargetVersionType] = useState("patch");
    const [targetStage, setTargetStage] = useState("draft");
    const [allProtocols, setAllProtocols] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [draggedIdx, setDraggedIdx] = useState(null);
    // initialize form when release loads
    useEffect(() => {
        if (release) {
            setForm({
                title: release.title ?? "",
                purpose: release.purpose ?? "",
                language: release.language ?? "en",
                tags: release.tags ? release.tags.join(", ") : "",
                protocols: release.includeProtocols || [],
                changeDescription: ""
            });
            setTargetStage(release.stage);
            setTargetVersionType("patch");
            setIsInitialized(true);
        }
    }, [release]);
    // Fetch master protocol DB list for search selector
    useEffect(() => {
        repo.getProtocols().then(setAllProtocols);
    }, [repo]);
    const unmappedProtocols = useMemo(() => {
        if (!searchQuery.trim())
            return [];
        const q = searchQuery.toLowerCase();
        return allProtocols.filter(p => !form.protocols.some(fp => fp.lineageId === p.id) &&
            (p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))).slice(0, 5); // Limit to top 5 hits
    }, [allProtocols, form.protocols, searchQuery]);
    if (!isNew && !release)
        return _jsxs("div", { className: "p-6 flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" }), " Fetching latest version context\u2026"] });
    if (!isInitialized)
        return _jsxs("div", { className: "p-6 flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" }), " Preparing editor\u2026"] });
    const canEdit = release?.stage === "draft" || release?.stage === "candidate";
    const hasChanges = isNew ? form.title.trim().length > 0 : true;
    const { major, minor, patch } = parseVersion(release?.version || "0.1.0");
    const nextPatch = `${major}.${minor}.${patch + 1}`;
    const nextMinor = `${major}.${minor + 1}.0`;
    async function onUnifiedSave(action, bumpLabel) {
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
                }
                setMsg("✅ Suite published!");
                if (onClose)
                    setTimeout(() => onClose(sid), 800);
            }
            else {
                await repo.updateSuiteDraft(release.lineageId, release.version, {
                    title: form.title,
                    purpose: form.purpose,
                    tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
                    language: form.language,
                    includeProtocols: mappedProtocols
                });
                setMsg("✅ Suite updated!");
                if (onClose)
                    setTimeout(() => onClose(), 800);
            }
        }
        catch (e) {
            setMsg("❌ " + e.message);
        }
        finally {
            setSaving(false);
        }
    }
    const addProtocol = (p) => {
        setForm({ ...form, protocols: [...form.protocols, { lineageId: p.lineageId || p.id, title: p.title, slug: p.slug }] });
        setSearchQuery("");
    };
    const removeProtocol = (lineageId) => {
        setForm({ ...form, protocols: form.protocols.filter(p => p.lineageId !== lineageId) });
    };
    const handleDragStart = (e, index) => {
        if (!canEdit || saving)
            return;
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };
    const handleDragOver = (e, index) => {
        if (!canEdit || saving)
            return;
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };
    const handleDrop = (e, dropIndex) => {
        if (!canEdit || saving)
            return;
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === dropIndex)
            return;
        const updated = [...form.protocols];
        const [moved] = updated.splice(draggedIdx, 1);
        updated.splice(dropIndex, 0, moved);
        setForm({ ...form, protocols: updated });
        setDraggedIdx(null);
    };
    const handleDragEnd = () => {
        setDraggedIdx(null);
    };
    return (_jsxs("div", { className: "mx-auto max-w-3xl p-6 space-y-6", children: [_jsxs("header", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: isNew ? "Create Suite" : "Edit Suite" }), _jsx("div", { className: "text-sm font-medium text-gray-500 mt-2", children: isNew ? (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-400", children: "Context:" }), _jsx("span", { className: "uppercase tracking-widest text-xs bg-gray-100 rounded-full px-2.5 py-0.5 border border-gray-200", children: parentNeedId || "Network" })] })) : (_jsxs(_Fragment, { children: ["Editing version: ", _jsxs("span", { className: "font-mono bg-gray-100 px-1.5 rounded", children: ["v", release?.version] })] })) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setIsSaveModalOpen(true), disabled: !canEdit || saving || !hasChanges, className: "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed", children: "Publish" }), onClose && (_jsx("button", { onClick: () => onClose(), "aria-label": "Close Editor", className: "rounded-lg p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors ml-1", children: _jsx(X, { className: "w-5 h-5" }) }))] })] }), !canEdit && (_jsxs("div", { className: "rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 flex items-center gap-3", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-amber-500 animate-pulse" }), "This version is currently marked as ", release.stage.toUpperCase(), ". Create a new draft branch to unlock semantic edits."] })), _jsxs("label", { className: "block", htmlFor: "suite-title", children: [_jsxs("div", { className: "text-sm font-medium text-gray-700", children: ["Title ", isNew ? "" : _jsx("span", { className: "text-xs text-gray-400 font-normal ml-1", children: "(Immutable via Lineage)" })] }), _jsx("input", { id: "suite-title", name: "title", className: `mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${!isNew ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`, value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), disabled: !isNew })] }), _jsxs("div", { className: "flex gap-6", children: [_jsxs("label", { className: "block flex-1", htmlFor: "suite-language", children: [_jsxs("div", { className: "text-sm font-medium text-gray-700", children: ["Language ", _jsx("span", { className: "text-xs text-gray-400 font-normal ml-1", children: "(Immutable)" })] }), _jsx("input", { id: "suite-language", name: "language", className: "mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50 text-gray-500 cursor-not-allowed", placeholder: "en", value: form.language, onChange: (e) => setForm({ ...form, language: e.target.value }), disabled: true })] }), _jsxs("label", { className: "block flex-1", htmlFor: "suite-tags", children: [_jsx("div", { className: "text-sm font-medium text-gray-700", children: "Tags (comma separated)" }), _jsx("input", { id: "suite-tags", name: "tags", className: "mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none", placeholder: "tag1, tag2", value: form.tags, onChange: (e) => setForm({ ...form, tags: e.target.value }), disabled: !canEdit || saving })] })] }), _jsxs("label", { className: "block", htmlFor: "suite-purpose", children: [_jsx("div", { className: "text-sm font-medium text-gray-700", children: "Purpose" }), _jsx("textarea", { id: "suite-purpose", name: "purpose", className: "mt-1.5 w-full text-base rounded-xl border border-gray-300 p-2.5 h-24 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none", value: form.purpose, onChange: (e) => setForm({ ...form, purpose: e.target.value }), disabled: !canEdit || saving })] }), _jsxs("div", { className: "pt-4 border-t border-gray-100", children: [_jsx("div", { className: "text-sm font-medium text-gray-700 mb-3", children: "Protocol Requirements" }), canEdit && (_jsxs("div", { className: "mb-4 relative", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search repository for protocols to add...", className: "w-full text-sm rounded-xl border border-gray-300 pl-9 pr-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50/50", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), unmappedProtocols.length > 0 && (_jsx("div", { className: "absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden divide-y divide-gray-100", children: unmappedProtocols.map(p => (_jsxs("button", { onClick: () => addProtocol(p), className: "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: p.title }), _jsx("div", { className: "text-xs text-gray-500 truancate max-w-[200px]", children: p.summary || "No summary provided" })] }), _jsx(PlusCircle, { className: "w-5 h-5 text-blue-600" })] }, p.id))) })), searchQuery.trim() && unmappedProtocols.length === 0 && (_jsxs("div", { className: "absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 text-sm text-center text-gray-500", children: ["No new protocols found matching \"", searchQuery, "\""] }))] })), _jsxs("div", { className: "space-y-3", children: [form.protocols.map((p, idx) => (_jsxs("div", { draggable: canEdit && !saving, onDragStart: (e) => handleDragStart(e, idx), onDragOver: (e) => handleDragOver(e, idx), onDrop: (e) => handleDrop(e, idx), onDragEnd: handleDragEnd, className: `flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm transition-all ${canEdit && !saving ? "cursor-grab active:cursor-grabbing hover:border-gray-300" : ""} ${draggedIdx === idx ? "opacity-40 scale-[0.98]" : ""}`, children: [_jsxs("div", { className: "flex items-center gap-3", children: [canEdit && !saving && (_jsx("div", { className: "flex shrink-0 items-center justify-center p-1 hover:bg-gray-100 rounded text-gray-400 cursor-grab active:cursor-grabbing text-opacity-50 hover:text-opacity-100", children: _jsx(GripVertical, { className: "w-5 h-5" }) })), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-900 leading-tight", children: p.title || p.slug }), _jsx("div", { className: "text-xs text-gray-500 mt-0.5", children: p.lineageId })] })] }), _jsx("button", { onClick: () => removeProtocol(p.lineageId), disabled: !canEdit || saving, className: "p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }, p.lineageId))), form.protocols.length === 0 && (_jsx("div", { className: "text-sm text-gray-500 italic p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center", children: "No protocols linked to this suite yet." }))] })] }), msg && _jsx("div", { className: "text-sm font-medium text-gray-600 bg-gray-50 border p-3 rounded-xl shadow-sm", children: msg }), _jsx(Dialog, { open: isSaveModalOpen, onOpenChange: setIsSaveModalOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Publish Changes to This Suite" }), _jsx(DialogDescription, { children: "Select how you want to release these changes." })] }), _jsxs("div", { className: "space-y-6 py-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "What changed?" }), isNew ? (_jsxs("div", { className: "p-3 border rounded-lg border-blue-500 bg-blue-50 text-blue-900", children: [_jsx("span", { className: "block text-sm font-medium", children: "Initial Publish (v0.1.0)" }), _jsxs("span", { className: "block text-xs text-blue-700/80 mt-1", children: ["This will index the Suite definition comprising ", form.protocols.length, " protocol mappings."] })] })) : (_jsxs("div", { className: "grid grid-cols-1 gap-2", children: [_jsxs("label", { className: `flex items-center p-3 border rounded-lg cursor-pointer transition ${targetVersionType === 'patch' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`, children: [_jsx("input", { type: "radio", name: "versionType", value: "patch", checked: targetVersionType === 'patch', onChange: () => setTargetVersionType('patch'), className: "h-4 w-4 text-blue-600" }), _jsxs("span", { className: "ml-3 block", children: [_jsxs("span", { className: "block text-sm font-medium", children: ["Small fix or cleanup (v", nextPatch, ")"] }), _jsx("span", { className: "block text-xs text-gray-500", children: "Append a new structural patch version. No prior records are overwritten." })] })] }), _jsxs("label", { className: `flex items-center p-3 border rounded-lg cursor-pointer transition ${targetVersionType === 'minor' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`, children: [_jsx("input", { type: "radio", name: "versionType", value: "minor", checked: targetVersionType === 'minor', onChange: () => setTargetVersionType('minor'), className: "h-4 w-4 text-blue-600" }), _jsxs("span", { className: "ml-3 block", children: [_jsxs("span", { className: "block text-sm font-medium", children: ["Improvement or clarification (v", nextMinor, ")"] }), _jsx("span", { className: "block text-xs text-gray-500", children: "Append a new minor feature block layout. No prior records are overwritten." })] })] })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Readiness" }), _jsxs("div", { className: "flex p-1 bg-gray-100 rounded-lg", children: [_jsx("button", { onClick: () => setTargetStage('draft'), className: `flex-1 py-1.5 text-sm font-medium rounded-md transition ${targetStage === 'draft' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`, children: "Still Evolving" }), _jsx("button", { onClick: () => !isNew && setTargetStage('candidate'), disabled: isNew, className: `flex-1 py-1.5 text-sm font-medium rounded-md transition ${targetStage === 'candidate' ? 'bg-white shadow-sm text-amber-700' : 'text-gray-500 hover:text-gray-700'} ${isNew ? 'opacity-40 cursor-not-allowed' : ''}`, children: "Ready for Review" }), _jsx("button", { onClick: () => !isNew && setTargetStage('stable'), disabled: isNew, className: `flex-1 py-1.5 text-sm font-medium rounded-md transition ${targetStage === 'stable' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'} ${isNew ? 'opacity-40 cursor-not-allowed' : ''}`, children: "Ready to Use" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", htmlFor: "change-note", children: "Add a note (optional)" }), _jsx("p", { className: "text-xs text-gray-500 mt-1 mb-2", children: "Help others understand what\u2019s different." }), _jsx("textarea", { id: "change-note", className: "w-full text-sm rounded-lg border border-gray-300 p-3 h-20 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none", placeholder: "...", value: form.changeDescription, onChange: (e) => setForm({ ...form, changeDescription: e.target.value }) })] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-gray-100", children: [_jsx("button", { onClick: () => setIsSaveModalOpen(false), className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Cancel" }), _jsx("button", { onClick: () => onUnifiedSave(isNew ? "create" : "update"), disabled: saving, className: "px-6 py-2 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: saving ? "Publishing..." : "Confirm & Publish" })] })] }) })] }));
}
