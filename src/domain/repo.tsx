import React, { createContext, useContext, useMemo } from "react";
import type { RPRepository } from "./ports";
import type { SectionId } from "./types";
import { mockRepo } from "@/adapters/mock";
import { useSession } from "@/features/auth/SessionProvider";
import { AtpAgent } from "@atproto/api";
import { AtprotoAdapter } from "@/adapters/atproto";
import { appViewAdapter } from "@/adapters/appview";

const RepoCtx = createContext<RPRepository>(mockRepo);

export function RepoProvider({ children, repo }: { children: React.ReactNode; repo?: RPRepository }) {
    const { session } = useSession();
    const canonicalDid = (import.meta.env.VITE_RP_CANONICAL_DID as string) || ""; // DID that hosts canonical rProtocols
    const service = (import.meta.env.VITE_PDS_URL as string) || "https://r.radical.world";

    const value = useMemo<RPRepository>(() => {
        // external override always wins
        if (repo) return repo;

        // Create a base proxy that prefers AppView for reads, but falls back to mockRepo
        // for complex relational mock queries (like getNeedTree) which haven't been ported to SQL yet.
        const baseReader: any = Object.create(mockRepo);
        
        baseReader.getNeedByRootId = async (id: string) => {
            const res = await appViewAdapter.getNeedByRootId(id);
            return res || mockRepo.getNeedByRootId?.(id);
        };
        
        baseReader.getProtocol = async (id: string) => {
            const res = await appViewAdapter.getProtocol(id);
            return res || mockRepo.getProtocol(id);
        };

        baseReader.getProtocolBySlug = async (slug: string) => {
            const res = await appViewAdapter.getProtocol(slug);
            return res || mockRepo.getProtocolBySlug?.(slug);
        };

        baseReader.getProtocolByVersion = async (slug: string, version: string) => {
            const res = await appViewAdapter.getProtocol(slug);
            return res || mockRepo.getProtocolByVersion?.(slug, version);
        };

        baseReader.getProtocols = async () => {
            const res = await appViewAdapter.getProtocols();
            if (res && res.length > 0) return res;
            return mockRepo.getProtocols();
        };

        baseReader.getNeedsBySection = async (section: SectionId) => {
            const res = await appViewAdapter.getNeedsBySection(section);
            if (res && res.length > 0) return res;
            return mockRepo.getNeedsBySection(section);
        };

        baseReader.getSuitesForNeed = async (needId: string) => {
            const res = await appViewAdapter.getSuitesForNeed(needId);
            if (res && res.length > 0) return res;
            return mockRepo.getSuitesForNeed(needId);
        };

        baseReader.getSuiteProtocols = async (suiteId: string) => {
            const res = await appViewAdapter.getSuiteProtocols(suiteId);
            if (res && res.length > 0) return res;
            return mockRepo.getSuiteProtocols(suiteId);
        };

        // When signed in, intercept and fork write ops to the PDS network
        if (session) {
            const agent = new AtpAgent({ service });
            (agent as any).resumeSession?.({
                did: session.did,
                handle: session.handle ?? "",
                accessJwt: session.accessJwt,
                refreshJwt: session.refreshJwt,
            });
            const at = new AtprotoAdapter(agent, canonicalDid, session.did);

            // HYBRID: delegate to baseReader via prototype, override writes
            const hybrid: any = Object.create(baseReader);
            hybrid.getNeedByRootId = baseReader.getNeedByRootId;
            hybrid.getProtocol = baseReader.getProtocol;
            hybrid.getProtocolBySlug = baseReader.getProtocolBySlug;
            hybrid.getProtocolByVersion = baseReader.getProtocolByVersion;
            hybrid.getProtocols = baseReader.getProtocols;
            hybrid.getNeedsBySection = baseReader.getNeedsBySection;
            hybrid.getSuitesForNeed = baseReader.getSuitesForNeed;
            hybrid.getSuiteProtocols = baseReader.getSuiteProtocols;
            hybrid.getMarks = at.getMarks.bind(at);
            hybrid.follow = at.follow.bind(at);
            hybrid.unfollow = at.unfollow.bind(at);
            hybrid.adopt = at.adopt?.bind(at) ?? (() => Promise.resolve());
            hybrid.unadopt = at.unadopt?.bind(at) ?? (() => Promise.resolve());
            
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
                await mockRepo.updateProtocolDraft(rootId, version, patch);
            };
            hybrid.promoteProtocolVersion = async (rootId: string, version: string, toStage: "candidate" | "stable" | "deprecated", changeDescription?: string) => {
                await at.promoteProtocolVersion(rootId, version, toStage, changeDescription);
                await mockRepo.promoteProtocolVersion(rootId, version, toStage, changeDescription);
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