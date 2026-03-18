import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNeed } from "@/features/needs/hooks/useNeed";
import TiptapEditor from "@/components/ui/TiptapEditor";
export default function NeedEditorProfile({ rootId: propRootId, onClose } = {}) {
    const params = useParams();
    const rootId = propRootId || params.lineageId || "";
    const { release, loading, error, latest, updateDraft, promote } = useNeed(rootId);
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
    if (loading)
        return _jsx("div", { className: "p-6", children: "Loading editor\u2026" });
    if (error)
        return _jsx("div", { className: "p-6 text-red-600", children: error });
    if (!release)
        return _jsx("div", { className: "p-6", children: "No draft available." });
    if (!isInitialized)
        return _jsxs("div", { className: "p-6 flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" }), " Preparing editor\u2026"] });
    const canEdit = release.stage === "draft" || release.stage === "candidate";
    async function onSave() {
        setSaving(true);
        try {
            const changes = {
                ...form,
                tags: form.tags.split(",").map(t => t.trim()).filter(Boolean)
            };
            await updateDraft(release.version, changes);
            setMsg("✅ Draft saved.");
        }
        catch (e) {
            setMsg("❌ " + e.message);
        }
        finally {
            setSaving(false);
        }
    }
    async function onPromoteCandidate() {
        setSaving(true);
        try {
            await promote(release.version, "candidate", "Promoted via editor");
            setMsg("✅ Promoted to candidate.");
        }
        catch (e) {
            setMsg("❌ " + e.message);
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "mx-auto max-w-3xl p-6 space-y-4", children: [_jsxs("header", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Edit Need" }), _jsxs("div", { className: "text-sm text-gray-500 mt-1", children: ["Editing version: ", _jsxs("span", { className: "font-mono", children: ["v", release.version] }), latest && latest !== release.version ? ` (latest is v${latest})` : ""] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: onSave, disabled: !canEdit || saving, className: "rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition disabled:opacity-50", children: "Save Draft" }), _jsx("button", { onClick: onPromoteCandidate, disabled: !canEdit || saving, className: "rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-green-700 transition disabled:opacity-50", children: "Promote to Candidate" }), onClose && (_jsx("button", { onClick: onClose, className: "rounded p-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors ml-2", children: "Cancel" }))] })] }), !canEdit && (_jsxs("div", { className: "rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800", children: ["This version is ", _jsx("b", { children: release.stage }), ". Create a new draft to edit content."] })), _jsxs("label", { className: "block", htmlFor: "need-title", children: [_jsx("div", { className: "text-sm font-medium text-gray-700", children: "Title" }), _jsx("input", { id: "need-title", name: "title", className: "mt-1 w-full rounded border p-2", value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), onClick: () => console.warn("Title input clicked!"), disabled: false })] }), _jsxs("label", { className: "block", htmlFor: "need-language", children: [_jsx("div", { className: "text-sm font-medium text-gray-700", children: "Language" }), _jsx("input", { id: "need-language", name: "language", className: "mt-1 w-full rounded border p-2", placeholder: "e.en", value: form.language, onChange: (e) => setForm({ ...form, language: e.target.value }), disabled: !canEdit || saving })] }), _jsxs("label", { className: "block", htmlFor: "need-tags", children: [_jsx("div", { className: "text-sm font-medium text-gray-700", children: "Tags (comma separated)" }), _jsx("input", { id: "need-tags", name: "tags", className: "mt-1 w-full rounded border p-2", placeholder: "tag1, tag2", value: form.tags, onChange: (e) => setForm({ ...form, tags: e.target.value }), disabled: !canEdit || saving })] }), _jsxs("label", { className: "block", htmlFor: "need-purpose", children: [_jsx("div", { className: "text-sm font-medium text-gray-700", children: "Purpose" }), _jsx("textarea", { id: "need-purpose", name: "purpose", className: "mt-1 w-full rounded border p-2 h-24", value: form.purpose, onChange: (e) => setForm({ ...form, purpose: e.target.value }), disabled: !canEdit || saving })] }), _jsxs("label", { className: "block", htmlFor: "need-description", children: [_jsx("div", { className: "text-sm font-medium text-gray-700 mb-1", children: "Description (Markdown)" }), _jsx("div", { className: !canEdit || saving ? "opacity-60 pointer-events-none" : "", children: _jsx(TiptapEditor, { content: form.description, onChange: (value) => setForm({ ...form, description: value }) }) })] }), msg && _jsx("div", { className: "text-sm text-gray-500", children: msg })] }));
}
