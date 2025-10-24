// src/components/ProtocolTile.tsx
import ProtocolBadge from "@/features/protocols/components/ProtocolBadge";
import { Release } from "@/features/protocols/lib/releases";
import { Link } from "react-router-dom";

export function ProtocolTile({
    id, release,
    }: { id: string; release: Release }) {
    return (
        <div className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
        <div className="flex items-start justify-between">
            <h3 className="font-semibold text-base">{id.replace(/-/g, " ")}</h3>
            <ProtocolBadge version={release.version} stage={release.stage} />
        </div>
        <p className="mt-2 text-sm text-zinc-700 line-clamp-3">{release.purpose}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-zinc-600">
            <span>Follows: {release.followCount}</span>
            <span>Adopts: {release.adoptCount}</span>
        </div>
        <div className="mt-4 flex gap-2">
            <Link
                className="text-sm underline underline-offset-2"
                to={`/protocols/${id}/versions/${release.version}`}
                >
                Open
            </Link>
            {release.shortUrl && <span className="text-xs text-zinc-500">{release.shortUrl}</span>}
        </div>
        </div>
    );
}