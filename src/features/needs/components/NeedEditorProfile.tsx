import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNeed } from "@/features/needs/hooks/useNeed";
import { useNeedReleases } from "@/features/needs/hooks/useNeedReleases";

export default function NeedEditorProfile() {
  const { rootId = "" } = useParams();
  const { release, loading, error, updateDraft, promote } = useNeed(rootId);
  const { latest } = useNeedReleases(rootId);
  const [form, setForm] = useState({ title: "", description: "", purpose: "", language: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // initialize form when release loads
  useEffect(() => {
    if (release) {
      setForm({
        title: release.title ?? "",
        description: release.description ?? "",
        purpose: release.purpose ?? "",
        language: release.language ?? "en",
      });
    }
  }, [release]);

  if (loading) return <div className="p-6">Loading editor…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!release) return <div className="p-6">No draft available.</div>;

  const canEdit = release.stage === "draft" || release.stage === "candidate";

  async function onSave() {
    setSaving(true);
    try {
      await updateDraft(release.version, form);
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
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Need</h1>
        <div className="text-sm text-gray-500">
          Editing version: <span className="font-mono">v{release.version}</span>
          {latest && latest !== release.version ? ` (latest is v${latest})` : ""}
        </div>
      </header>

      {!canEdit && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          This version is <b>{release.stage}</b>. Create a new draft to edit content.
        </div>
      )}

      <label className="block">
        <div className="text-sm font-medium text-gray-700">Title</div>
        <input
          className="mt-1 w-full rounded border p-2"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          disabled={!canEdit || saving}
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium text-gray-700">Purpose</div>
        <textarea
          className="mt-1 w-full rounded border p-2 h-24"
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          disabled={!canEdit || saving}
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium text-gray-700">Description (Markdown)</div>
        <textarea
          className="mt-1 w-full rounded border p-2 h-40"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          disabled={!canEdit || saving}
        />
      </label>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={!canEdit || saving}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          onClick={onPromoteCandidate}
          disabled={!canEdit || saving}
          className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Promote to Candidate
        </button>
      </div>

      {msg && <div className="text-sm text-gray-500">{msg}</div>}
    </div>
  );
}