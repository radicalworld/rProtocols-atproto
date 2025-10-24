import { useState } from "react";
// TODO: wire this to a backend POST /api/needs (create root + 0.1 draft)
export default function NewNeedProfile() {
  const [form, setForm] = useState({
    rootId: "",
    title: "",
    purpose: "",
    description: "",
    language: "en",
    tags: "" // comma-separated
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function onCreate() {
    setSaving(true);
    setMsg("");
    try {
      // Placeholder — implement POST /api/needs on your server and call it here:
      // const res = await fetch("/api/needs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload }) });
      // if (!res.ok) throw new Error(await res.text());
      // const data = await res.json();
      // navigate(`/needs/${data.rootId}`);
      setTimeout(() => {}, 0);
      setMsg("✅ Need creation endpoint not yet wired — server route pending.");
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Create a New Need</h1>

      <label className="block">
        <div className="text-sm font-medium text-gray-700">Root ID (slug)</div>
        <input
          className="mt-1 w-full rounded border p-2"
          placeholder="e.g., how-do-we-share-open-protocols"
          value={form.rootId}
          onChange={(e) => setForm({ ...form, rootId: e.target.value })}
          disabled={saving}
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium text-gray-700">Title</div>
        <input
          className="mt-1 w-full rounded border p-2"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          disabled={saving}
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium text-gray-700">Purpose</div>
        <textarea
          className="mt-1 w-full rounded border p-2 h-24"
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          disabled={saving}
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium text-gray-700">Description (Markdown)</div>
        <textarea
          className="mt-1 w-full rounded border p-2 h-40"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          disabled={saving}
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium text-gray-700">Language</div>
        <input
          className="mt-1 w-full rounded border p-2"
          value={form.language}
          onChange={(e) => setForm({ ...form, language: e.target.value })}
          disabled={saving}
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium text-gray-700">Tags (comma-separated)</div>
        <input
          className="mt-1 w-full rounded border p-2"
          placeholder="health, wellness"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          disabled={saving}
        />
      </label>

      <button
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        onClick={onCreate}
        disabled={saving}
      >
        Create Need
      </button>

      {msg && <div className="text-sm text-gray-500">{msg}</div>}
    </div>
  );
}