import { apiFetch } from "./client";

export function fetchNeed(rootId: string) {
  return apiFetch(`/needs/${rootId}`); // GET -> { root, version, displayVersion }
}

export function fetchNeedVersion(rootId: string, version: string) {
  return apiFetch(`/needs/${rootId}/v/${version}`); // GET
}

export function createNeedDraft(rootId: string, baseVersion: string, nextVersion: string) {
  return apiFetch(`/needs/${rootId}/drafts`, {
    method: "POST",
    body: JSON.stringify({ baseVersion, nextVersion }),
  });
}

export function updateNeedDraft(
  rootId: string,
  version: string,
  patch: Partial<{ title: string; description: string; purpose: string; language: string; tags: string[]; changeDescription: string }>
) {
  return apiFetch(`/needs/${rootId}/v/${version}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function promoteNeedVersion(rootId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string) {
  return apiFetch(`/needs/${rootId}/v/${version}/stage`, {
    method: "POST",
    body: JSON.stringify({ toStage, changeDescription }),
  });
}

export function diffNeed(rootId: string, a: string, b: string) {
  const q = new URLSearchParams({ a, b }).toString();
  return apiFetch(`/needs/${rootId}/diff?${q}`); // GET -> { a, b, diffs }
}