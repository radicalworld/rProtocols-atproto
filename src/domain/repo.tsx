import React, { createContext, useContext, useMemo } from "react";
import type { RPRepository } from "./ports";
import type { SectionId, Need, Protocol } from "./types";
import { mockRepo } from "@/adapters/mock";
import { useSession } from "@/features/auth/SessionProvider";
import { AtpAgent } from "@atproto/api";
import { AtprotoAdapter } from "@/adapters/atproto";
import { AppViewAdapter } from "@/adapters/appview";

const appViewAdapter = new AppViewAdapter();

const RepoCtx = createContext<RPRepository>(mockRepo);

export function RepoProvider({ children, repo }: { children: React.ReactNode; repo?: RPRepository }) {
    const { session } = useSession();
    const canonicalDid = (import.meta.env.VITE_RP_CANONICAL_DID as string) || ""; // DID that hosts canonical rProtocols
    const service = (import.meta.env.VITE_PDS_URL as string) || "https://r.radical.world";

    const value = useMemo<RPRepository>(() => {
        // external override always wins
        if (repo) return repo;

        // Create a base proxy that prefers mockRepo in DEV so local edits reflect instantly.
        // In prod, it prefers AppView for reads, falling back to mockRepo for un-ported queries.

        const useMockFirst = false;

        const baseReader: any = Object.create(mockRepo);

        baseReader.getNeedByLineageId = async (id: string) => {
            if (useMockFirst) return mockRepo.getNeedByLineageId?.(id);
            const res = await (appViewAdapter as any).getNeedByLineageId?.(id);
            return res || mockRepo.getNeedByLineageId?.(id);
        };

        baseReader.getProtocol = async (id: string) => {
            if (useMockFirst) return mockRepo.getProtocol(id);
            const res = await appViewAdapter.getProtocol(id);
            return res || mockRepo.getProtocol(id);
        };

        baseReader.getProtocolBySlug = async (slug: string) => {
            if (useMockFirst) return mockRepo.getProtocolBySlug?.(slug);
            const res = await appViewAdapter.getProtocol(slug);
            return res || mockRepo.getProtocolBySlug?.(slug);
        };

        baseReader.getProtocolByVersion = async (slug: string, version: string) => {
            if (useMockFirst) return mockRepo.getProtocolByVersion?.(slug, version);
            const res = await appViewAdapter.getProtocol(slug);
            return res || mockRepo.getProtocolByVersion?.(slug, version);
        };

        baseReader.getSuite = async (id: string) => {
            if (useMockFirst) return mockRepo.getSuite(id);
            // Fallback to appview if implemented, otherwise mock repo directly
            const res = await (appViewAdapter as any).getSuite?.(id);
            return res || mockRepo.getSuite(id);
        };

        baseReader.getProtocols = async () => {
            if (useMockFirst) return mockRepo.getProtocols();
            const res = await appViewAdapter.getProtocols();
            if (res && res.length > 0) return res;
            return mockRepo.getProtocols();
        };

        baseReader.getNeedsBySection = async (section: SectionId) => {
            if (useMockFirst) return mockRepo.getNeedsBySection(section);
            const res = await appViewAdapter.getNeedsBySection();
            if (res && res.length > 0) return res;
            return mockRepo.getNeedsBySection(section);
        };

        baseReader.getSuitesForNeed = async (needId: string) => {
            if (useMockFirst) return mockRepo.getSuitesForNeed(needId);
            const res = await appViewAdapter.getSuitesForNeed(needId);
            if (res && res.length > 0) return res;
            return mockRepo.getSuitesForNeed(needId);
        };

        baseReader.getSuiteProtocols = async (suiteId: string) => {
            if (useMockFirst) return mockRepo.getSuiteProtocols(suiteId);
            const res = await appViewAdapter.getSuiteProtocols(suiteId);
            if (res && res.length > 0) return res;
            return mockRepo.getSuiteProtocols(suiteId);
        };

        // When signed in, intercept and fork write ops to the PDS network
        if (session) {
            const agent = new AtpAgent({ service });
            // Swallow bad session cache throws from @atproto/api natively inside the render loop
            agent.resumeSession({
                did: session.did,
                handle: session.handle ?? "",
                accessJwt: session.accessJwt,
                refreshJwt: session.refreshJwt,
                active: true,
            }).catch(err => console.warn("Stale PDS session resume dropped:", err));
            const at = new AtprotoAdapter(agent, canonicalDid, session.did);

            // HYBRID: delegate to baseReader via prototype, override writes
            const hybrid: any = Object.create(baseReader);
            hybrid.getNeedByLineageId = baseReader.getNeedByLineageId;
            hybrid.getProtocol = baseReader.getProtocol;
            hybrid.getProtocolBySlug = baseReader.getProtocolBySlug;
            hybrid.getProtocolByVersion = baseReader.getProtocolByVersion;
            hybrid.getProtocols = baseReader.getProtocols;
            hybrid.getNeedsBySection = baseReader.getNeedsBySection;
            hybrid.getSuitesForNeed = baseReader.getSuitesForNeed;
            hybrid.getSuite = baseReader.getSuite;
            hybrid.getSuiteProtocols = baseReader.getSuiteProtocols;
            hybrid.getMarks = at.getMarks.bind(at);
            hybrid.follow = at.follow.bind(at);
            hybrid.unfollow = at.unfollow.bind(at);
            hybrid.adopt = at.adopt?.bind(at) ?? (() => Promise.resolve());
            hybrid.unadopt = at.unadopt?.bind(at) ?? (() => Promise.resolve());

            // Global Asset Creation -> PDS & Local Cache
            hybrid.createNeed = async (payload: Pick<Need, "title" | "description" | "parentLineageId">) => {
                const id = await mockRepo.createNeed(payload);
                await (at as any).createNeed(payload, id);
                return id;
            };
            
            hybrid.createProtocol = async (payload: Pick<Protocol, "title" | "summary" | "body" | "tags" | "language">) => {
                const id = await mockRepo.createProtocol(payload);
                await (at as any).createProtocol(payload, id);
                return id;
            };

            hybrid.linkProtocolServesNeed = async (pid: string, nid: string) => {
                await mockRepo.linkProtocolServesNeed(pid, nid);
                await (at as any).linkProtocolServesNeed(pid, nid);
            };

            // Need Editor Mutations -> PDS & Local Cache
            hybrid.updateNeedDraft = async (rootId: string, version: string, patch: any) => {
                await at.updateNeedDraft(rootId, version, patch);
                await mockRepo.updateNeedDraft(rootId, version, patch);
            };
            hybrid.promoteNeedVersion = async (rootId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string) => {
                await at.promoteNeedVersion(rootId, version, toStage, changeDescription);
                await mockRepo.promoteNeedVersion(rootId, version, toStage, changeDescription);
            };

            // Protocol Editor Mutations -> PDS & Local Cache
            hybrid.updateProtocolDraft = async (rootId: string, version: string, patch: any) => {
                await at.updateProtocolDraft(rootId, version, patch);
                await (mockRepo as any).updateProtocolDraft?.(rootId, version, patch);
            };
            hybrid.promoteProtocolVersion = async (rootId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string) => {
                await at.promoteProtocolVersion(rootId, version, toStage, changeDescription);
                await (mockRepo as any).promoteProtocolVersion?.(rootId, version, toStage, changeDescription);
            };

            // Suite Editor Mutations -> PDS Cache
            hybrid.updateSuiteDraft = async (rootId: string, version: string, patch: any) => {
                await (at as any).updateSuiteDraft?.(rootId, version, patch);
            };
            hybrid.promoteSuiteVersion = async (rootId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string) => {
                await (at as any).promoteSuiteVersion?.(rootId, version, toStage, changeDescription);
            };

            return hybrid as RPRepository;
        }

        // Signed out → Read from AppView w/ Mock fallback
        return baseReader as RPRepository;
    }, [repo, session, canonicalDid, service]);

    return <RepoCtx.Provider value={value}>{children}</RepoCtx.Provider>;
}

export function useRepo() {
    return useContext(RepoCtx);
}