import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useProtocolEditor } from "@/features/protocols/hooks/useProtocolEditor";
import TiptapEditor from "@/components/ui/TiptapEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { X } from "lucide-react";
export default function ProtocolEditorProfile({ protocolId: propRootId, onClose } = {}) {
    const params = useParams();
    const rootId = propRootId || params.id || "";
    const { draft, loading, error, latest, publishProtocol } = useProtocolEditor(rootId);
    const [form, setForm] = useState({ title: "", summary: "", body: "", language: "", tags: "", changeDescription: "" });
    const [saving, setSaving] = useState(false);
    // Modal State
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [targetVersionType, setTargetVersionType] = useState("patch");
    const [targetStage, setTargetStage] = useState("draft");
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
                tags: draft.tags ? draft.tags.join(", ") : "",
                changeDescription: "" // Reset per modal publish open
            });
            // Setup defaults for Modal
            setTargetStage(draft.stage);
            setTargetVersionType("patch");
            requestAnimationFrame(() => setIsInitialized(true));
        }
    }, [draft]);
    console.log("🖥️ RENDER. isInitialized:", isInitialized, "Form body length:", form.body?.length);
    if (loading)
        return _jsx("div", { className: "p-6 text-sm text-gray-500", children: "Loading editor\u2026" });
    if (error)
        return _jsx("div", { className: "p-6 text-red-600", children: error });
    if (!draft)
        return _jsx("div", { className: "p-6 text-sm text-gray-500", children: "No draft available." });
    if (!isInitialized)
        return _jsxs("div", { className: "p-6 text-sm text-gray-500 flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" }), " Preparing editor\u2026"] });
    const canEdit = draft.stage === "draft" || draft.stage === "candidate";
    const hasChanges = draft ? (form.title !== (draft.title ?? "") ||
        form.summary !== (draft.summary ?? "") ||
        form.body !== (draft.body ?? "") ||
        form.language !== (draft.language ?? "en") ||
        form.tags !== (draft.tags ? draft.tags.join(", ") : "")) : false;
    // Derived Versions for Modal
    const currentVer = draft?.version || "1.0.0";
    const parts = currentVer.split('.');
    let major = parseInt(parts[0], 10);
    if (isNaN(major))
        major = 1;
    const minor = parseInt(parts[1], 10) || 0;
    const patch = parseInt(parts[2], 10) || 0;
    const nextPatch = `${major}.${minor}.${patch + 1}`;
    const nextMinor = `${major}.${minor + 1}.0`;
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
            await publishProtocol(targetVersionType, targetStage, currentContent);
            setIsSaveModalOpen(false);
            if (onClose) {
                // Return to viewer gracefully
                onClose();
            }
            else {
                setMsg("✅ Successfully published!");
            }
        }
        catch (e) {
            setMsg("❌ " + e.message);
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "mx-auto max-w-3xl p-6 space-y-4 animate-fade-in-up", children: [_jsxs("header", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Edit Protocol" }), _jsxs("div", { className: "text-sm text-gray-500 mt-1", children: ["Editing version: ", _jsxs("span", { className: "font-mono", children: ["v", draft.version] }), latest && latest !== draft.version ? ` (latest is v${latest})` : ""] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setIsSaveModalOpen(true), disabled: !hasChanges, className: "rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed", children: "Publish" }), onClose && (_jsx("button", { onClick: onClose, "aria-label": "Close Editor", className: "rounded-lg p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors ml-1", children: _jsx(X, { className: "w-5 h-5" }) }))] })] }), _jsxs("label", { className: "block", htmlFor: "protocol-title", children: [_jsxs("div", { className: "text-sm font-medium text-gray-700", children: ["Title ", _jsx("span", { className: "text-xs text-gray-400 font-normal ml-1", children: "(Immutable via Lineage)" })] }), _jsx("input", { id: "protocol-title", name: "title", className: "mt-1 w-full text-base rounded border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50 text-gray-600 cursor-not-allowed", value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), disabled: true })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("label", { className: "block flex-1", htmlFor: "protocol-language", children: [_jsxs("div", { className: "text-sm font-medium text-gray-700", children: ["Language ", _jsx("span", { className: "text-xs text-gray-400 font-normal ml-1", children: "(Immutable)" })] }), _jsx("input", { id: "protocol-language", name: "language", className: "mt-1 w-full text-base rounded border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-gray-50 text-gray-600 cursor-not-allowed", placeholder: "en", value: form.language, onChange: (e) => setForm({ ...form, language: e.target.value }), disabled: true })] }), _jsxs("label", { className: "block flex-1", htmlFor: "protocol-tags", children: [_jsx("div", { className: "text-sm font-medium text-gray-700", children: "Tags (comma separated)" }), _jsx("input", { id: "protocol-tags", name: "tags", className: "mt-1 w-full text-base rounded border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none", placeholder: "tag1, tag2", value: form.tags, onChange: (e) => setForm({ ...form, tags: e.target.value }), disabled: !canEdit || saving })] })] }), _jsxs("label", { className: "block", htmlFor: "protocol-summary", children: [_jsx("div", { className: "text-sm font-medium text-gray-700", children: "Summary" }), _jsx("textarea", { id: "protocol-summary", name: "summary", className: "mt-1 w-full text-base rounded border border-gray-300 p-2 h-20 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none", value: form.summary, onChange: (e) => setForm({ ...form, summary: e.target.value }), disabled: !canEdit || saving })] }), _jsxs("label", { className: "block", htmlFor: "protocol-body", children: [_jsx("div", { className: "text-sm font-medium text-gray-700 mb-1", children: "Body (Markdown)" }), _jsx("div", { className: !canEdit || saving ? "opacity-60 pointer-events-none" : "", children: _jsx(TiptapEditor, { content: form.body, onChange: (value) => setForm({ ...form, body: value }) }) })] }), msg && _jsx("div", { className: "text-sm font-medium text-gray-600 bg-gray-50 border p-2 rounded", children: msg }), _jsx(Dialog, { open: isSaveModalOpen, onOpenChange: setIsSaveModalOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Publish Changes to This Protocol" }), _jsx(DialogDescription, { children: "Select how you want to release these changes." })] }), _jsxs("div", { className: "space-y-6 py-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "What changed?" }), _jsxs("div", { className: "grid grid-cols-1 gap-2", children: [_jsxs("label", { className: `flex items-center p-3 border rounded-lg cursor-pointer transition ${targetVersionType === 'patch' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`, children: [_jsx("input", { type: "radio", name: "versionType", value: "patch", checked: targetVersionType === 'patch', onChange: () => setTargetVersionType('patch'), className: "h-4 w-4 text-blue-600" }), _jsxs("span", { className: "ml-3 block", children: [_jsxs("span", { className: "block text-sm font-medium", children: ["Small fix or cleanup (v", nextPatch, ")"] }), _jsx("span", { className: "block text-xs text-gray-500", children: "Typos, wording, or formatting\u2014no change in meaning." })] })] }), _jsxs("label", { className: `flex items-center p-3 border rounded-lg cursor-pointer transition ${targetVersionType === 'minor' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`, children: [_jsx("input", { type: "radio", name: "versionType", value: "minor", checked: targetVersionType === 'minor', onChange: () => setTargetVersionType('minor'), className: "h-4 w-4 text-blue-600" }), _jsxs("span", { className: "ml-3 block", children: [_jsxs("span", { className: "block text-sm font-medium", children: ["Improvement or clarification (v", nextMinor, ")"] }), _jsx("span", { className: "block text-xs text-gray-500", children: "Adds detail or improves the protocol without changing its direction." })] })] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Readiness" }), _jsxs("div", { className: "flex p-1 bg-gray-100 rounded-lg", children: [_jsx("button", { onClick: () => setTargetStage('draft'), className: `flex-1 py-1.5 text-sm font-medium rounded-md transition ${targetStage === 'draft' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`, children: "Still Evolving" }), _jsx("button", { onClick: () => setTargetStage('candidate'), className: `flex-1 py-1.5 text-sm font-medium rounded-md transition ${targetStage === 'candidate' ? 'bg-white shadow-sm text-amber-700' : 'text-gray-500 hover:text-gray-700'}`, children: "Ready for Review" }), _jsx("button", { onClick: () => setTargetStage('stable'), className: `flex-1 py-1.5 text-sm font-medium rounded-md transition ${targetStage === 'stable' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`, children: "Ready to Use" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", htmlFor: "change-note", children: "Add a note (optional)" }), _jsx("p", { className: "text-xs text-gray-500 mt-1 mb-2", children: "Help others understand what\u2019s different." }), _jsx("textarea", { id: "change-note", className: "w-full text-sm rounded-lg border border-gray-300 p-3 h-20 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none", placeholder: "...", value: form.changeDescription, onChange: (e) => setForm({ ...form, changeDescription: e.target.value }) })] })] }), _jsxs(DialogFooter, { children: [_jsx("button", { onClick: () => setIsSaveModalOpen(false), className: "px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition", children: "Cancel" }), _jsx("button", { onClick: onUnifiedSave, disabled: saving, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50", children: saving ? "Publishing..." : "Publish Changes" })] })] }) })] }));
}
