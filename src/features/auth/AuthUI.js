import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState } from "react";
const Ctx = createContext(null);
export function AuthUIProvider({ children }) {
    const [signInOpen, setSignInOpen] = useState(false);
    const [signUpOpen, setSignUpOpen] = useState(false);
    const value = useMemo(() => ({
        signInOpen,
        signUpOpen,
        openSignIn: () => { setSignUpOpen(false); setSignInOpen(true); },
        openSignUp: () => { setSignInOpen(false); setSignUpOpen(true); },
        closeAll: () => { setSignInOpen(false); setSignUpOpen(false); },
    }), [signInOpen, signUpOpen]);
    return _jsx(Ctx.Provider, { value: value, children: children });
}
export function useAuthUI() {
    const ctx = useContext(Ctx);
    if (!ctx)
        throw new Error("useAuthUI must be used within <AuthUIProvider>");
    return ctx;
}
