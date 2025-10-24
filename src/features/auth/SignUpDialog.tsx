import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { useSession } from "@/features/auth/SessionProvider";

export default function SignUpDialog() {
  const { signUp, busy, error, setError, session } = useSession();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // Close automatically once authenticated
  useEffect(() => { if (session && open) setOpen(false); }, [session, open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (busy) return;
    const ok = await signUp({
      email: email || undefined,
      handle: handle.trim(),
      password,
      inviteCode: inviteCode || undefined,
    });
    if (ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setError(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-2xl">
          <UserPlus className="mr-1 h-4 w-4" /> Sign up
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader><DialogTitle>Create account</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-3">
          <Input placeholder="Email (optional)" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <Input placeholder="Handle (e.g. name.rp.social)" value={handle} onChange={(e)=>setHandle(e.target.value)} required />
          <Input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <Input placeholder="Invite code (if required)" value={inviteCode} onChange={(e)=>setInviteCode(e.target.value)} />
          <Button disabled={busy} type="submit">{busy ? "Creating…" : "Create account"}</Button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </form>
      </DialogContent>
    </Dialog>
  );
}