import { useEffect, useMemo, useState } from "react";
import { useRepo } from "@/domain/repo";

/**
 * Tracks whether the viewer has an "adopt" mark for a subjectId.
 * Optimistically toggles while persisting via repo.adopt/unadopt.
 */
export function useAdopted(subjectId: string) {
  const repo = useRepo();
  const [marks, setMarks] = useState<{ subjectId: string }[]>([]);
  const [optimistic, setOptimistic] = useState<null | boolean>(null); // null = no override

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await repo.getMarks("adopt");
        if (alive) setMarks(m as any);
      } catch {
        /* no-op */
      }
    })();
    return () => { alive = false; };
  }, [repo]);

  const adopted = useMemo(() => {
    if (optimistic !== null) return optimistic;
    return marks.some((m) => m.subjectId === subjectId);
  }, [marks, optimistic, subjectId]);

  const toggleAdopt = async () => {
    if (adopted) {
      setOptimistic(false);
      try { await repo.unadopt?.(subjectId); } finally {}
    } else {
      setOptimistic(true);
      try { await repo.adopt(subjectId); } finally {}
    }
  };

  return { adopted, toggleAdopt };
}