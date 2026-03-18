import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn } from "lucide-react";
import { useSession } from "@/features/auth/SessionProvider";
export default function SignInDialog({ onOpenChange } = {}) {
    const { signIn, busy, error, setError, session } = useSession();
    const [open, setOpen] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    // ✅ Close automatically once we have a user
    useEffect(() => {
        if (session && open) {
            setOpen(false);
            onOpenChange?.(false);
            setPassword(""); // reset sensitive input
        }
    }, [session, open, onOpenChange]);
    async function onSubmit(e) {
        e.preventDefault();
        setError?.(null);
        // Prevent double-submits
        if (busy)
            return;
        // Some providers return boolean, others throw on error.
        try {
            const res = await signIn(identifier.trim(), password);
            // If your signIn returns a boolean, close on success:
            if (typeof res === "boolean" && res) {
                setOpen(false);
                setPassword("");
            }
            // If it doesn't return anything, the useEffect above will still close
            // as soon as `user` becomes non-null.
        }
        catch {
            // error state is handled in provider; dialog stays open to show message
        }
    }
    return (_jsxs(Dialog, { open: open, onOpenChange: (val) => {
            setOpen(val);
            onOpenChange?.(val);
        }, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", className: "rounded-2xl", children: [_jsx(LogIn, { className: "mr-1 h-4 w-4" }), " Sign in"] }) }), _jsxs(DialogContent, { className: "rounded-2xl sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Sign in" }) }), _jsxs("form", { onSubmit: onSubmit, className: "grid gap-3", children: [_jsx(Input, { placeholder: "Email or handle", value: identifier, onChange: (e) => setIdentifier(e.target.value), required: true, autoFocus: true }), _jsx(Input, { placeholder: "Password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true }), _jsx(Button, { disabled: busy, type: "submit", children: busy ? "Signing in…" : "Sign in" }), error && _jsx("div", { className: "text-sm text-red-600", children: error })] })] })] }));
}
