import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn } from "lucide-react";
import { useSession } from "@/features/auth/SessionProvider";

export default function SignInDialog() {
    const { signIn, busy, error, setError, user } = useSession();
    const [open, setOpen] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    // ✅ Close automatically once we have a user
    useEffect(() => {
        if (user && open) {
            setOpen(false);
            setPassword(""); // reset sensitive input
        }
    }, [user, open]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError?.(null);

        // Prevent double-submits
        if (busy) return;

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
        } catch {
            // error state is handled in provider; dialog stays open to show message
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="rounded-2xl">
                <LogIn className="mr-1 h-4 w-4" /> Sign in
                </Button>
            </DialogTrigger>

            <DialogContent className="rounded-2xl sm:max-w-md">
                <DialogHeader>
                <DialogTitle>Sign in</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="grid gap-3">
                <Input
                    placeholder="Email or handle"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoFocus
                />
                <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Button disabled={busy} type="submit">
                    {busy ? "Signing in…" : "Sign in"}
                </Button>
                {error && <div className="text-sm text-red-600">{error}</div>}
                </form>
            </DialogContent>
        </Dialog>
    );
}