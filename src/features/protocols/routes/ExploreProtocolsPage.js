import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/ExploreProtocolsPage.tsx
import { collections } from "@/data/seeds";
import { useReleasesCollection } from "@/features/protocols/hooks/useReleasesCollection";
import { ProtocolTile } from "@/features/protocols/components/ProtocolTile";
export default function ExploreProtocolsPage() {
    const draftsAndRCs = useReleasesCollection(collections.draftsAndRCs);
    const mostAdopted = useReleasesCollection(collections.mostAdopted);
    const recentChanges = useReleasesCollection(collections.recentChanges);
    return (_jsxs("div", { className: "mx-auto max-w-6xl p-6 space-y-10", children: [_jsx(Section, { title: "Drafts & RCs", items: draftsAndRCs }), _jsx(Section, { title: "Most Adopted", items: mostAdopted }), _jsx(Section, { title: "Recent Changes", items: recentChanges })] }));
}
function Section({ title, items, }) {
    return (_jsxs("section", { children: [_jsx("h2", { className: "text-xl font-semibold", children: title }), _jsx("div", { className: "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: items.map(({ id, release }) => (_jsx(ProtocolTile, { id: id, release: release }, `${id}@${release.version}`))) })] }));
}
