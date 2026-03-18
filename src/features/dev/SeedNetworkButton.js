import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRepo } from "@/domain/repo";
import { needs, protocols, suites } from "@/data/seeds";
export function SeedNetworkButton() {
    const repo = useRepo();
    const [loading, setLoading] = useState(false);
    const handleSeed = async () => {
        if (!confirm("This will blast all local seeds to the PDS. Proceed?"))
            return;
        setLoading(true);
        try {
            // Seed Needs
            for (const nId of Object.keys(needs)) {
                const need = needs[nId];
                const rootId = need.lineageId || need.id;
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
            // Seed Suites
            for (const sId of Object.keys(suites)) {
                const s = suites[sId];
                const rootId = s.lineageId || s.id;
                console.log(`Seeding Suite: ${s.title}`);
                await repo.updateSuiteDraft?.(rootId, "1.0", s);
                await repo.promoteSuiteVersion?.(rootId, "1.0", "stable", "Initial Seed");
            }
            alert("Network successfully seeded! Data should now appear in the AppView.");
        }
        catch (error) {
            console.error(error);
            alert("Error seeding network. Check console.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(Button, { onClick: handleSeed, disabled: loading, variant: "destructive", children: loading ? "Seeding Firehose..." : "DEV: Seed ATProto Network" }));
}
