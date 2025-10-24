import { useEffect, useState } from "react";
import { useRepo } from "@/domain/repo";
import type { SectionId, Need } from "@/domain/types";
import { NeedCard } from "@/features/needs/NeedCard";

export function SectionPage({ section }: { section: SectionId }) {
    const repo = useRepo();
    const [intro, setIntro] = useState("");
    const [needs, setNeeds] = useState<Need[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const sections = await repo.listSections();
            const current = sections.find((s) => s.id === section);
            if (mounted) setIntro(current?.intro ?? "");
            const list = await repo.getNeedsBySection(section);
            if (mounted) setNeeds(list);
        })();
        return () => { mounted = false; };
    }, [repo, section]);

    console.log("NEEDS", needs)

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-4">
            <h1 className="text-2xl font-semibold capitalize">{section}</h1>
            {intro && <p className="text-gray-600">{intro}</p>}

            <div className="space-y-4">
                {needs.map((n) => (
                    <NeedCard key={n.id} needId={n.id} />
                ))}
            </div>
        </div>
    );
}