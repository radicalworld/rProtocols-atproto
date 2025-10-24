// ProtocolActions.tsx
import { useRepo } from "@/domain/repo";

export function ProtocolActions({ protocolId }: { protocolId: string }) {
  const repo = useRepo();
  return (
    <div className="flex gap-1">
      <button onClick={() => repo.follow(protocolId)} className="rounded-lg border px-2 py-1 text-xs">Follow</button>
      <button onClick={() => repo.adopt(protocolId)} className="rounded-lg bg-black px-2 py-1 text-xs text-white">
        Adopt
      </button>
    </div>
  );
}