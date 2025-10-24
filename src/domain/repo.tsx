import React, { createContext, useContext, useMemo } from "react";
import type { RPRepository } from "./ports";
import { mockRepo } from "@/adapters/mock";
import { useSession } from "@/features/auth/SessionProvider";
import { AtpAgent } from "@atproto/api";
import { AtprotoAdapter } from "@/adapters/atproto";

const RepoCtx = createContext<RPRepository>(mockRepo);

export function RepoProvider({ children, repo }: { children: React.ReactNode; repo?: RPRepository }) {
    const { session } = useSession();
    const canonicalDid = (import.meta.env.VITE_RP_CANONICAL_DID as string) || ""; // DID that hosts canonical rProtocols
    const service = (import.meta.env.VITE_PDS_URL as string) || "https://r.radical.world";

    const value = useMemo<RPRepository>(() => {
        // external override always wins
        if (repo) return repo;

        // when signed in, create an adapter but only use it for marks/writes
        if (session) {
            const agent = new AtpAgent({ service });
            (agent as any).resumeSession?.({
                did: session.did,
                handle: session.handle ?? "",
                accessJwt: session.accessJwt,
                refreshJwt: session.refreshJwt,
            });
            const at = new AtprotoAdapter(agent, canonicalDid, session.did);

            // HYBRID: delegate to mockRepo via prototype, override only what we need
            const hybrid: any = Object.create(mockRepo);
            hybrid.getMarks = at.getMarks.bind(at);
            hybrid.follow = at.follow.bind(at);
            hybrid.unfollow = at.unfollow.bind(at);
            hybrid.adopt = at.adopt?.bind(at) ?? (() => Promise.resolve());
            hybrid.unadopt = at.unadopt?.bind(at) ?? (() => Promise.resolve());
            return hybrid as RPRepository;
        }
 
        // signed out → pure mock
        return mockRepo;
    }, [repo, session, canonicalDid, service]);
        
    return <RepoCtx.Provider value={value}>{children}</RepoCtx.Provider>;
}

export function useRepo() {
    return useContext(RepoCtx);
}