// server/signup.ts (Express)
import express from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

const PDS_URL = process.env.PDS_URL ?? "https://pds.radical.world";

app.get("/api/pds/describe", async (_req, res) => {
  const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.describeServer`);
  const data = await r.json();
  res.json(data); // { inviteCodeRequired, availableUserDomains, did, ... }
});

app.post("/api/signup", async (req, res) => {
  const { email, handle, password, inviteCode } = req.body;

  // Basic input hardening
  if (!email || !handle || !password) {
    return res.status(400).json({ error: "Missing email, handle or password" });
  }

  const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Fields supported by ATProto; include inviteCode if your PDS requires it
    body: JSON.stringify({ email, handle, password, inviteCode }),
  });

  const data = await r.json();
  if (!r.ok) {
    return res.status(r.status).json({ error: data?.message ?? "Signup failed", details: data });
  }

  // Set secure, httpOnly cookies for tokens
  // NOTE: in dev over http, set secure: false; in prod behind HTTPS, set true.
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };

  if (data.accessJwt) res.cookie("accessJwt", data.accessJwt, cookieOpts);
  if (data.refreshJwt) res.cookie("refreshJwt", data.refreshJwt, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 });

  // Return minimal public info to the client
  res.json({ did: data.did, handle: data.handle });
});

app.post("/api/login", async (req, res) => {
  const { identifier, password } = req.body; // identifier = handle or email
  if (!identifier || !password) return res.status(400).json({ error: "Missing identifier or password" });

  const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await r.json();
  if (!r.ok) return res.status(r.status).json({ error: data?.message ?? "Login failed", details: data });

  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };

  if (data.accessJwt) res.cookie("accessJwt", data.accessJwt, cookieOpts);
  if (data.refreshJwt) res.cookie("refreshJwt", data.refreshJwt, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 });

  res.json({ did: data.did, handle: data.handle });
});

export default app;