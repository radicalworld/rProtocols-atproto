// src/pages/ExploreProtocolsPage.tsx
import { collections } from "@/data/seeds";
import { useReleasesCollection } from "@/features/protocols/hooks/useReleasesCollection";
import { ProtocolTile } from "@/features/protocols/components/ProtocolTile";

export default function ExploreProtocolsPage() {
  const draftsAndRCs = useReleasesCollection(collections.draftsAndRCs);
  const mostAdopted = useReleasesCollection(collections.mostAdopted);
  const recentChanges = useReleasesCollection(collections.recentChanges);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-10">
      <Section title="Drafts & RCs" items={draftsAndRCs} />
      <Section title="Most Adopted" items={mostAdopted} />
      <Section title="Recent Changes" items={recentChanges} />
    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; release: any }>;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ id, release }) => (
          <ProtocolTile key={`${id}@${release.version}`} id={id} release={release} />
        ))}
      </div>
    </section>
  );
}