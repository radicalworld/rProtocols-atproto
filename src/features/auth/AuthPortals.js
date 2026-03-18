import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuthUI } from "./AuthUI";
import { useSession } from "@/features/auth/SessionProvider";
/**
 * Replace <SignInModal/> and <SignUpModal/> with YOUR existing popup components.
 * They should accept: open, onOpenChange, and onSuccess (optional).
 */
export function AuthPortals() {
    const { signInOpen, signUpOpen, closeAll, openSignUp } = useAuthUI();
    const { signIn } = useSession();
    // ---- EXAMPLE WIRING to your existing components ----
    // If your components have different prop names, just adapt below.
    return (_jsxs(_Fragment, { children: [_jsx(SignInModal, { open: signInOpen, onOpenChange: (v) => (v ? null : closeAll()), onSubmit: async (email, password) => {
                    await signIn(email.trim(), password);
                    closeAll();
                }, onGoToSignUp: () => openSignUp() }), _jsx(SignUpModal, { open: signUpOpen, onOpenChange: (v) => (v ? null : closeAll()) })] }));
}
/* ---------- PLACEHOLDERS ----------
Delete these if you already have real components. They're here only to make TS happy.
*/
function SignInModal(_) { return null; }
function SignUpModal(_) { return null; }
