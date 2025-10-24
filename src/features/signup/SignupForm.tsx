// src/features/signup/SignupForm.tsx
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePdsConfig } from "./usePdsConfig";
import { useSession } from "@/features/auth/SessionProvider";

type DoneInfo = { did: string; handle: string };

const PDS_URL = (import.meta.env.VITE_PDS_URL as string) || "https://r.radical.world";
const DID_SERVER_URL = import.meta.env.VITE_DID_SERVER_URL as string | undefined;
const REGISTRY_TOKEN = import.meta.env.VITE_REGISTRY_TOKEN as string | undefined;

export default function SignupForm({ onDone }: { onDone?: (info: DoneInfo) => void }) {
    const { cfg, loading } = usePdsConfig();
    const [localPart, setLocalPart] = useState("");
    const [domain, setDomain] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    // state for the two-stage flow
    const [stage, setStage] = useState<"idle" | "creating" | "waiting-proof" | "finalizing" | "done">("idle");
    const [did, setDid] = useState<string | null>(null);
    const [requestedHandle, setRequestedHandle] = useState<string | null>(null);

    const rawDomains = cfg?.availableUserDomains ?? ["r.radical.world"];
    const domainValues = rawDomains.map(d => d.replace(/^\.+/, "")); // strip leading "."
    const selectedDomain = (domain ?? domainValues[0])!;
    const { signIn } = useSession();

    const handle = useMemo(() => {
    const lp = (localPart || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, ""); // no leading/trailing "-"
    if (!lp) return "";
    return `${lp}.${selectedDomain}`;
    }, [localPart, selectedDomain]);

    const validUsername = (lp: string) =>
        /^[a-z0-9-]{3,}$/.test(lp) && !lp.startsWith("-") && !lp.endsWith("-");

    async function createAccountTemp() {
        // Use a temp handle to get the DID immediately
        const tempHandle = `tmp-${crypto.randomUUID().slice(0, 8)}.${selectedDomain}`;
        const body: any = {
        email: email.trim(),
        password,
        handle: tempHandle,
        };
        if (cfg?.inviteCodeRequired) body.inviteCode = inviteCode.trim();

        const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        });
        const data = await r.json();
        if (!r.ok) {
        throw new Error(data?.message || data?.error || "createAccount failed");
        }
        // Some PDS builds also return accessJwt; we’ll just login later to be safe
        return { did: data.did as string };
  }

    console.debug("VITE_DID_SERVER_URL", DID_SERVER_URL);
    console.debug("VITE_REGISTRY_TOKEN", REGISTRY_TOKEN ? "(present)" : "(missing)");

    async function registerDidForHandle(username: string, did: string) {
    if (!DID_SERVER_URL) return; // auto-mode off → skip

    // normalize + basic guardrails
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9-]{3,}$/.test(u) || u.startsWith("-") || u.endsWith("-")) {
        throw new Error("Invalid username format");
    }
    if (!did.startsWith("did:")) {
        throw new Error("Invalid DID");
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (REGISTRY_TOKEN) headers["X-Registry-Token"] = REGISTRY_TOKEN;

    const rr = await fetch(`${DID_SERVER_URL}/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({ username: u, did }),
    });

    if (!rr.ok) {
        const msg = await rr.text().catch(() => "");
        // helpfully surface common causes
        if (rr.status === 401 || rr.status === 403) {
        throw new Error("Registry unauthorized. Check VITE_REGISTRY_TOKEN and server REGISTRY_TOKEN.");
        }
        throw new Error(`DID register failed (${rr.status}): ${msg || "unknown error"}`);
    }
    }

  async function updateHandle(accessJwt: string, h: string) {
    const r = await fetch(`${PDS_URL}/xrpc/com.atproto.identity.updateHandle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${accessJwt}`,
      },
      body: JSON.stringify({ handle: h }),
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`updateHandle failed: ${t}`);
    }
  }

  async function resolveHandle(h: string) {
    const r = await fetch(
      `${PDS_URL}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(h)}`
    );
    if (!r.ok) throw new Error(`resolveHandle failed: ${await r.text()}`);
    return (await r.json()) as { did: string };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // basic client validation
    const [lp, dom] = [localPart.trim().toLowerCase(), selectedDomain];
    if (!validUsername(lp)) {
      setError("Username must be [a-z0-9-], min 3 chars, no leading/trailing hyphen.");
      return;
    }
    if (!dom) {
      setError("Please select a domain.");
      return;
    }

    setStage("creating");
    try {
      const { did } = await createAccountTemp();
      setDid(did);
      setRequestedHandle(`${lp}.${dom}`);

      // If you have a DID registry configured, auto-register and finalize
      if (DID_SERVER_URL) {
        await registerDidForHandle(lp, did);
        setStage("finalizing");

        // sign in to get access/refresh + update global session UI
        const session = await signIn(email.trim(), password);

        // use the fresh access token to finalize the handle
        await updateHandle(session.accessJwt, `${lp}.${dom}`);
        
        // const access = await login(email.trim()); // login by email is safest
        // await updateHandle(access, `${lp}.${dom}`);

        const res = await resolveHandle(`${lp}.${dom}`);
        setStage("done");
        onDone?.({ did: res.did, handle: `${lp}.${dom}` });
        return;
      }

      // Otherwise, wait for admin to add the tiny Caddy stanza
      setStage("waiting-proof");
    } catch (err: any) {
      setStage("idle");
      setError(err?.message || String(err));
    }
  }

    // For “manual proof” mode (no DID_SERVER_URL)
    async function onIAddedCaddy() {
        if (!requestedHandle) return;
        setError(null);
        setStage("finalizing");
        try {
            // sign in so the header updates and we get accessJwt
            const session = await signIn(email.trim(), password);
            await updateHandle(session.accessJwt, requestedHandle);
            
            // const access = await login(email.trim());
            // await updateHandle(access, requestedHandle);

            const res = await resolveHandle(requestedHandle);
            setStage("done");
            onDone?.({ did: res.did, handle: requestedHandle });
        } catch (err: any) {
            setStage("waiting-proof");
            setError(err?.message || String(err));
        }
    }

    const caddySnippet =
        did && requestedHandle
        ? `# Caddy vhost for ${requestedHandle}
    ${requestedHandle} {
    @wellknown path /.well-known/atproto-did
    handle @wellknown {
        header Content-Type text/plain
        respond "${did}" 200
    }
    respond 404
    }`
        : "";

    const handleValid =
        !!localPart &&
        /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?\.[a-z0-9.-]+$/.test(handle);

  if (loading) return <div>Loading…</div>;

  return (
    <div className="grid gap-4 max-w-md">
      <form onSubmit={onSubmit} className="grid gap-4">
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="flex gap-2">
            <Input
                placeholder="username"
                value={localPart}
                onChange={(e) => setLocalPart(e.target.value)}
                required
            />
            <select
                className="border rounded px-2"
                value={selectedDomain}
                onChange={(e) => setDomain(e.target.value)}
            >
                {domainValues.map((d) => (
                    <option key={d} value={d}>
                        .{d}
                    </option>
                ))}
            </select>
        </div>

        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {cfg?.inviteCodeRequired && (
          <Input
            placeholder="Invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
        )}

        <Button type="submit" disabled={!handleValid || !email || !password || !localPart}>
            Create account
        </Button>
      </form>

        {!handleValid && localPart && (
            <div className="text-red-600 text-sm">Input/handle must be a valid handle</div>
        )}

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {/* Manual-proof mode UI (no DID server) */}
      {!DID_SERVER_URL && stage === "waiting-proof" && did && requestedHandle && (
        <div className="grid gap-2">
          <div className="text-sm">
            Add this tiny Caddy block for <code>{requestedHandle}</code>, then click the button:
          </div>
          <pre className="bg-gray-100 p-3 text-xs overflow-auto">{caddySnippet}</pre>
          <div className="text-xs text-neutral-500">
            It must serve <code>/.well-known/atproto-did</code> with <code>{did}</code>.
          </div>
          <div className="flex gap-2">
            <Button onClick={onIAddedCaddy} disabled={stage === "finalizing"}>
              I added it — finalize handle
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                // quick check to help debug
                try {
                  const r = await fetch(`https://${requestedHandle}/.well-known/atproto-did`);
                  const txt = await r.text();
                  setError(r.ok ? `Well-known says: ${txt}` : `HTTP ${r.status}: ${txt}`);
                } catch (e: any) {
                  setError(e?.message || String(e));
                }
              }}
            >
              Test well-known
            </Button>
          </div>
        </div>
      )}

      {stage === "done" && requestedHandle && did && (
        <div className="text-green-700 text-sm">
          Created <b>{requestedHandle}</b> · DID: <code>{did}</code>
        </div>
      )}
    </div>
  );
}