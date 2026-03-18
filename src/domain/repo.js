import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from "react";
import { mockRepo } from "@/adapters/mock";
import { useSession } from "@/features/auth/SessionProvider";
import { AtpAgent } from "@atproto/api";
import { AtprotoAdapter } from "@/adapters/atproto";
import { AppViewAdapter } from "@/adapters/appview";
const appViewAdapter = new AppViewAdapter();
const RepoCtx = createContext(mockRepo);
export function RepoProvider({ children, repo }) {
    const { session } = useSession();
    const canonicalDid = import.meta.env.VITE_RP_CANONICAL_DID || ""; // DID that hosts canonical rProtocols
    const service = import.meta.env.VITE_PDS_URL || "https://r.radical.world";
    const value = useMemo(() => {
        // external override always wins
        if (repo)
            return repo;
        // Create a base proxy that prefers mockRepo in DEV so local edits reflect instantly.
        // In prod, it prefers AppView for reads, falling back to mockRepo for un-ported queries.
        const useMockFirst = false;
        const baseReader = Object.create(mockRepo);
        baseReader.getNeedByLineageId = async (id) => {
            if (useMockFirst)
                return mockRepo.getNeedByLineageId?.(id);
            const res = await appViewAdapter.getNeedByLineageId?.(id);
            return res || mockRepo.getNeedByLineageId?.(id);
        };
        baseReader.getProtocol = async (id) => {
            if (useMockFirst)
                return mockRepo.getProtocol(id);
            const res = await appViewAdapter.getProtocol(id);
            return res || mockRepo.getProtocol(id);
        };
        baseReader.getProtocolBySlug = async (slug) => {
            if (useMockFirst)
                return mockRepo.getProtocolBySlug?.(slug);
            const res = await appViewAdapter.getProtocol(slug);
            return res || mockRepo.getProtocolBySlug?.(slug);
        };
        baseReader.getProtocolByVersion = async (slug, version) => {
            if (useMockFirst)
                return mockRepo.getProtocolByVersion?.(slug, version);
            const res = await appViewAdapter.getProtocol(slug);
            return res || mockRepo.getProtocolByVersion?.(slug, version);
        };
        baseReader.getSuite = async (id) => {
            if (useMockFirst)
                return mockRepo.getSuite(id);
            // Fallback to appview if implemented, otherwise mock repo directly
            const res = await appViewAdapter.getSuite?.(id);
            return res || mockRepo.getSuite(id);
        };
        baseReader.getProtocols = async () => {
            if (useMockFirst)
                return mockRepo.getProtocols();
            const res = await appViewAdapter.getProtocols();
            if (res && res.length > 0)
                return res;
            return mockRepo.getProtocols();
        };
        baseReader.getNeedsBySection = async (section) => {
            if (useMockFirst)
                return mockRepo.getNeedsBySection(section);
            const res = await appViewAdapter.getNeedsBySection();
            if (res && res.length > 0)
                return res;
            return mockRepo.getNeedsBySection(section);
        };
        baseReader.getSuitesForNeed = async (needId) => {
            if (useMockFirst)
                return mockRepo.getSuitesForNeed(needId);
            const res = await appViewAdapter.getSuitesForNeed(needId);
            if (res && res.length > 0)
                return res;
            return mockRepo.getSuitesForNeed(needId);
        };
        baseReader.getSuiteProtocols = async (suiteId) => {
            if (useMockFirst)
                return mockRepo.getSuiteProtocols(suiteId);
            const res = await appViewAdapter.getSuiteProtocols(suiteId);
            if (res && res.length > 0)
                return res;
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
            const hybrid = Object.create(baseReader);
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
            // Need Editor Mutations -> PDS & Local Cache
            hybrid.updateNeedDraft = async (rootId, version, patch) => {
                await at.updateNeedDraft(rootId, version, patch);
                await mockRepo.updateNeedDraft(rootId, version, patch);
            };
            hybrid.promoteNeedVersion = async (rootId, version, toStage, changeDescription) => {
                await at.promoteNeedVersion(rootId, version, toStage, changeDescription);
                await mockRepo.promoteNeedVersion(rootId, version, toStage, changeDescription);
            };
            // Protocol Editor Mutations -> PDS & Local Cache
            hybrid.updateProtocolDraft = async (rootId, version, patch) => {
                await at.updateProtocolDraft(rootId, version, patch);
                await mockRepo.updateProtocolDraft?.(rootId, version, patch);
            };
            hybrid.promoteProtocolVersion = async (rootId, version, toStage, changeDescription) => {
                await at.promoteProtocolVersion(rootId, version, toStage, changeDescription);
                await mockRepo.promoteProtocolVersion?.(rootId, version, toStage, changeDescription);
            };
            // Suite Editor Mutations -> PDS Cache
            hybrid.updateSuiteDraft = async (rootId, version, patch) => {
                await at.updateSuiteDraft?.(rootId, version, patch);
            };
            hybrid.promoteSuiteVersion = async (rootId, version, toStage, changeDescription) => {
                await at.promoteSuiteVersion?.(rootId, version, toStage, changeDescription);
            };
            return hybrid;
        }
        // Signed out → Read from AppView w/ Mock fallback
        return baseReader;
    }, [repo, session, canonicalDid, service]);
    return _jsx(RepoCtx.Provider, { value: value, children: children });
}
export function useRepo() {
    return useContext(RepoCtx);
}
