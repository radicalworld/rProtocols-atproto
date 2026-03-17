import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRepo } from "@/domain/repo";
import { needs, protocols } from "@/data/seeds";

export function SeedNetworkButton() {
    const repo = useRepo();
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        if (!confirm("This will blast all local seeds to the PDS. Proceed?")) return;
        setLoading(true);
        try {
            // Seed Needs
            for (const nId of Object.keys(needs)) {
                const need = needs[nId] as any;
                const rootId = need.rootId || need.id;
                console.log(`Seeding Need: ${need.title}`, rootId);
                await repo.updateNeedDraft?.(rootId, "1.0", need);
                await repo.promoteNeedVersion?.(rootId, "1.0", "stable", "Initial Seed");
            }

            // Seed Protocols
            for (const pId of Object.keys(protocols)) {
                const p = protocols[pId];
                console.log(`Seeding Protocol: ${p.title}`);
                await repo.updateProtocolDraft?.(p.id, "1.0", p);
                await repo.promoteProtocolVersion?.(p.id, "1.0", "stable", "Initial Seed");
            }
            alert("Network successfully seeded! Data should now appear in the AppView.");
        } catch (error) {
            console.error(error);
            alert("Error seeding network. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleSeed} disabled={loading} variant="destructive">
            {loading ? "Seeding Firehose..." : "DEV: Seed ATProto Network"}
        </Button>
    );
}
