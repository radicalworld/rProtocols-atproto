// src/server/index.ts
import express from "express";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

const PDS_URL = process.env.PDS_URL ?? "https://pds.radical.world";

app.get("/api/pds/describe", async (_req, res) => {
  const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.describeServer`);
  const data = await r.json();
  res.json(data);
});

// app.post("/api/signup", async (req, res) => {
//   const { email, handle, password, inviteCode } = req.body || {};
//   if (!email || !handle || !password) {
//     return res.status(400).json({ error: "Missing email, handle or password" });
//   }

//   const r = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, handle, password, inviteCode }),
//   });

//   const data = await r.json();
//   if (!r.ok) return res.status(r.status).json({ error: data?.message ?? "Signup failed", details: data });

//   const isProd = process.env.NODE_ENV === "production";
//   const baseCookie = { httpOnly: true, sameSite: "lax" as const, secure: isProd, path: "/" };

//   if (data.accessJwt) res.cookie("accessJwt", data.accessJwt, { ...baseCookie, maxAge: 60 * 60 * 24 * 7 * 1000 });
//   if (data.refreshJwt) res.cookie("refreshJwt", data.refreshJwt, { ...baseCookie, maxAge: 60 * 60 * 24 * 30 * 1000 });

//   res.json({ did: data.did, handle: data.handle });
// });

app.post("/api/signup", async (req, res) => {
  const { email, handle, password } = req.body || {};
  if (!email || !handle || !password) {
    return res.status(400).json({ error: "Missing email, handle or password" });
  }

  try {
    // Auto-generate an invite code from your PDS admin identity
    const ADMIN_JWT = process.env.PDS_ADMIN_JWT!;
    const invite = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createInviteCode`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ useCount: 1 }),
    });

    const inviteData = await invite.json();
    const inviteCode = inviteData.code;

    // Create the user account
    const create = await fetch(`${PDS_URL}/xrpc/com.atproto.server.createAccount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, handle, password, inviteCode }),
    });

    const data = await create.json();
    if (!create.ok)
      return res.status(create.status).json({ error: data.message ?? "Signup failed", details: data });

    res.json({ did: data.did, handle: data.handle });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Signup service failed" });
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));