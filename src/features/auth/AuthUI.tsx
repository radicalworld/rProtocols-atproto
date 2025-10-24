import React, { createContext, useContext, useMemo, useState } from "react";

type AuthUIState = {
    signInOpen: boolean;
    signUpOpen: boolean;
    openSignIn: () => void;
    openSignUp: () => void;
    closeAll: () => void;
};

const Ctx = createContext<AuthUIState | null>(null);

export function AuthUIProvider({ children }: { children: React.ReactNode }) {
    const [signInOpen, setSignInOpen] = useState(false);
    const [signUpOpen, setSignUpOpen] = useState(false);

    const value = useMemo<AuthUIState>(() => ({
        signInOpen,
        signUpOpen,
        openSignIn: () => { setSignUpOpen(false); setSignInOpen(true); },
        openSignUp: () => { setSignInOpen(false); setSignUpOpen(true); },
        closeAll: () => { setSignInOpen(false); setSignUpOpen(false); },
    }), [signInOpen, signUpOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuthUI() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useAuthUI must be used within <AuthUIProvider>");
    return ctx;
}