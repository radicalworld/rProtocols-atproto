// src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Check, Copy, Globe, Hammer, LogIn, UserPlus2 } from "lucide-react";
import * as ed25519 from "@noble/ed25519";
import { Routes, Route, Navigate } from 'react-router-dom'
import { TopMenu } from "@/features/navigation/TopMenu";
import { HomePage } from "@/features/home/HomePage";
import { SectionPage } from "@/features/sections/SectionPage";
import { SuiteProfile } from "@/features/suites/SuiteProfile";
import { ProtocolProfile } from "@/features/protocols/components/ProtocolProfile";
import ExploreProtocolsPage from "@/features/protocols/routes/ExploreProtocolsPage";
import ProtocolVersionPage from "@/features/protocols/routes/ProtocolVersionPage";

import { NeedProfile } from "@/features/needs/components/NeedProfile";                      // /needs/:rootId
import NeedVersionProfile from "@/features/needs/components/NeedVersionProfile";            // /needs/:rootId/v/:version
import NeedEditorProfile from "@/features/needs/components/NeedEditorProfile";             // /needs/:rootId/edit
import NewNeedProfile from "@/features/needs/components/NewNeedProfile";                   // /needs/new

// ──────────────────────────────────────────────────────────────────────────────
// RW DID utilities (pilot/mock)
// NOTE: This generates a local Ed25519 keypair and formats a DID-like string.
// In production, swap for your RW DID service or ATProto-compliant flow.
// ──────────────────────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  did: "rw_did",
  secret: "rw_did_secret",
  pub: "rw_did_pub",
  profile: "rw_profile",
};

function bytesToBase64url(bytes: Uint8Array) {
  // Minimal base64url for browser
  const bin = String.fromCharCode(...bytes);
  const b64 = btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return b64;
}

async function createLocalRwDid(profile?: { email?: string; displayName?: string }) {
  const secret = ed25519.utils.randomPrivateKey();
  const pub = await ed25519.getPublicKeyAsync(secret);
  const pubB64 = bytesToBase64url(pub);
  const secretB64 = bytesToBase64url(secret);

  const did = `did:rw:${pubB64}`; // placeholder scheme for pilot

  // Persist locally for the pilot
  localStorage.setItem(STORAGE_KEYS.did, did);
  localStorage.setItem(STORAGE_KEYS.secret, secretB64);
  localStorage.setItem(STORAGE_KEYS.pub, pubB64);
  if (profile) localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));

  return { did, secretB64, pubB64 };
}

function loadIdentity() {
  const did = localStorage.getItem(STORAGE_KEYS.did) || null;
  const secret = localStorage.getItem(STORAGE_KEYS.secret) || null;
  const pub = localStorage.getItem(STORAGE_KEYS.pub) || null;
  const profileRaw = localStorage.getItem(STORAGE_KEYS.profile);
  const profile = profileRaw ? JSON.parse(profileRaw) : null;
  return { did, secret, pub, profile } as {
    did: string | null; secret: string | null; pub: string | null; profile: any;
  };
}

function clearIdentity() {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

function ContributionsPage() {
  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-semibold">MyContributions</h1>
      <p className="text-gray-600">Authored, edited, followed, and adopted items will appear here.</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Layout
// ──────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen">
        <TopMenu />
        <Routes>
            {/* Core sections */}
            <Route path="/" element={<HomePage />} />
            <Route path="/root" element={<SectionPage section="root" />} />
            <Route path="/work" element={<SectionPage section="work" />} />
            <Route path="/website" element={<SectionPage section="website" />} />
            
            {/* Suites & Protocols */}
            <Route path="/suite/:id" element={<SuiteProfile />} />
            <Route path="/protocol/:id" element={<ProtocolProfile />} />
            <Route path="/protocols/:id/versions/:version" element={<ProtocolVersionPage />} />

            {/* Needs routes */}
            <Route path="/needs/new" element={<NewNeedProfile />} />
            <Route path="/needs/:rootId" element={<NeedProfile />} />
            <Route path="/needs/:rootId/v/:version" element={<NeedVersionProfile />} />
            <Route path="/needs/:rootId/edit" element={<NeedEditorProfile />} />

            {/* Optional short link redirect */}
            {/* <Route path="/n/:rootId" element={<Navigate to={`/needs/${rootId}`} replace />} /> */}

            {/* Other */}
            <Route path="/contributions" element={<ContributionsPage />} />
            <Route path="/explore" element={<ExploreProtocolsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </div>
  );
}

function WebsiteSection({ did }: { did: string | null }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Globe className="h-5 w-5"/> Protocol Website Embeds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-neutral-600">Generate an iframe to embed adopted protocols on external sites. (Coming soon.)</p>
          <div className="text-xs text-neutral-500">DID: {did ? <span className="font-mono">{did}</span> : "(sign up to personalize)"}</div>
          {!did && <CalloutSignupPrompt />}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Public Profile (Preview)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-neutral-600">Your public RW identity will surface protocols you follow/adopt and your collab memberships.</p>
          <div className="text-xs text-neutral-500">Requires DID to enable.</div>
        </CardContent>
      </Card>
    </div>
  );
}

function CalloutSignupPrompt() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">
      <div className="text-sm">
        <span className="font-medium">Heads up:</span> Sign up with an RW DID to enable adoption, forks, and recognitions.
      </div>
    </motion.div>
  );
}

function NextStepsList() {
  return (
    <div className="text-sm">
      <div className="font-medium mb-1">Next steps to wire up for real:</div>
      <ol className="list-decimal pl-5 space-y-1 text-neutral-700">
        <li>Swap <span className="font-mono">createLocalRwDid()</span> for your RW DID service endpoint (PDS) to mint/anchor a DID.</li>
        <li>Store keys in a secure keystore (WebCrypto + passphrase) or delegate to a wallet; avoid localStorage.</li>
        <li>Attach DID auth to protocol actions (adopt/follow/fork/sign) and post to the Collaborative Ledger.</li>
        <li>Expose a read-only public profile page keyed by DID with adopted protocols & RAD recognitions.</li>
        <li>Add iframe generator for embedding selected protocols on external sites.</li>
      </ol>
    </div>
  );
}