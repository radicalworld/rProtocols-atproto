import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import * as ed25519 from "@noble/ed25519";
import { Routes, Route, Navigate } from 'react-router-dom';
import { TopMenu } from "@/features/navigation/TopMenu";
import { HomePage } from "@/features/home/HomePage";
import { SectionPage } from "@/features/sections/SectionPage";
import { SuiteProfile } from "@/features/suites/SuiteProfile";
import { ProtocolProfile } from "@/features/protocols/components/ProtocolProfile";
import ExploreProtocolsPage from "@/features/protocols/routes/ExploreProtocolsPage";
import ProtocolVersionPage from "@/features/protocols/routes/ProtocolVersionPage";
import { NeedProfile, NeedVersionProfile, NeedEditorProfile } from "@/features/needs/components";
import { SeedNetworkButton } from "@/features/dev/SeedNetworkButton";
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
function bytesToBase64url(bytes) {
    // Minimal base64url for browser
    const bin = String.fromCharCode(...bytes);
    const b64 = btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    return b64;
}
async function createLocalRwDid(profile) {
    const secret = ed25519.utils.randomSecretKey();
    const pub = await ed25519.getPublicKeyAsync(secret);
    const pubB64 = bytesToBase64url(pub);
    const secretB64 = bytesToBase64url(secret);
    const did = `did:rw:${pubB64}`; // placeholder scheme for pilot
    // Persist locally for the pilot
    localStorage.setItem(STORAGE_KEYS.did, did);
    localStorage.setItem(STORAGE_KEYS.secret, secretB64);
    localStorage.setItem(STORAGE_KEYS.pub, pubB64);
    if (profile)
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
    return { did, secretB64, pubB64 };
}
function loadIdentity() {
    const did = localStorage.getItem(STORAGE_KEYS.did) || null;
    const secret = localStorage.getItem(STORAGE_KEYS.secret) || null;
    const pub = localStorage.getItem(STORAGE_KEYS.pub) || null;
    const profileRaw = localStorage.getItem(STORAGE_KEYS.profile);
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    return { did, secret, pub, profile };
}
function clearIdentity() {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}
function ContributionsPage() {
    return (_jsxs("div", { className: "w-full px-4 lg:px-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "MyContributions" }), _jsx("p", { className: "text-gray-600", children: "Authored, edited, followed, and adopted items will appear here." }), _jsx("div", { className: "mt-8", children: _jsx(SeedNetworkButton, {}) })] }));
}
// ──────────────────────────────────────────────────────────────────────────────
// Layout
// ──────────────────────────────────────────────────────────────────────────────
export default function App() {
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx(TopMenu, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/collaboration/*", element: _jsx(SectionPage, { section: "collaboration" }) }), _jsx(Route, { path: "/work/*", element: _jsx(SectionPage, { section: "work" }) }), _jsx(Route, { path: "/website/*", element: _jsx(SectionPage, { section: "website" }) }), _jsx(Route, { path: "/suite/:id", element: _jsx(SuiteProfile, {}) }), _jsx(Route, { path: "/protocol/:id", element: _jsx(ProtocolProfile, {}) }), _jsx(Route, { path: "/protocols/:id/versions/:version", element: _jsx(ProtocolVersionPage, {}) }), _jsx(Route, { path: "/needs/new", element: _jsx(NeedEditorProfile, { isNew: true }) }), _jsx(Route, { path: "/needs/:rootId", element: _jsx(NeedProfile, {}) }), _jsx(Route, { path: "/needs/:rootId/v/:version", element: _jsx(NeedVersionProfile, {}) }), _jsx(Route, { path: "/needs/:rootId/edit", element: _jsx(NeedEditorProfile, {}) }), _jsx(Route, { path: "/contributions", element: _jsx(ContributionsPage, {}) }), _jsx(Route, { path: "/explore", element: _jsx(ExploreProtocolsPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] })] }));
}
function WebsiteSection({ did }) {
    return (_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs(Card, { className: "rounded-2xl shadow-sm", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(Globe, { className: "h-5 w-5" }), " Protocol Website Embeds"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx("p", { className: "text-sm text-neutral-600", children: "Generate an iframe to embed adopted protocols on external sites. (Coming soon.)" }), _jsxs("div", { className: "text-xs text-neutral-500", children: ["DID: ", did ? _jsx("span", { className: "font-mono", children: did }) : "(sign up to personalize)"] }), !did && _jsx(CalloutSignupPrompt, {})] })] }), _jsxs(Card, { className: "rounded-2xl shadow-sm", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Public Profile (Preview)" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx("p", { className: "text-sm text-neutral-600", children: "Your public RW identity will surface protocols you follow/adopt and your collab memberships." }), _jsx("div", { className: "text-xs text-neutral-500", children: "Requires DID to enable." })] })] })] }));
}
function CalloutSignupPrompt() {
    return (_jsx(motion.div, { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, className: "rounded-xl bg-yellow-50 border border-yellow-200 p-3", children: _jsxs("div", { className: "text-sm", children: [_jsx("span", { className: "font-medium", children: "Heads up:" }), " Sign up with an RW DID to enable adoption, forks, and recognitions."] }) }));
}
function NextStepsList() {
    return (_jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium mb-1", children: "Next steps to wire up for real:" }), _jsxs("ol", { className: "list-decimal pl-5 space-y-1 text-neutral-700", children: [_jsxs("li", { children: ["Swap ", _jsx("span", { className: "font-mono", children: "createLocalRwDid()" }), " for your RW DID service endpoint (PDS) to mint/anchor a DID."] }), _jsx("li", { children: "Store keys in a secure keystore (WebCrypto + passphrase) or delegate to a wallet; avoid localStorage." }), _jsx("li", { children: "Attach DID auth to protocol actions (adopt/follow/fork/sign) and post to the Collaborative Ledger." }), _jsx("li", { children: "Expose a read-only public profile page keyed by DID with adopted protocols & RAD recognitions." }), _jsx("li", { children: "Add iframe generator for embedding selected protocols on external sites." })] })] }));
}
