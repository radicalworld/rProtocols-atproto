import { useEffect, useMemo, useState } from "react";
import { useRepo } from "@/domain/repo";

/**
 * Tracks whether the current viewer has a "follow" mark for a given subjectId (need/protocol/suite).
 * Optimistically flips to true when you call `markFollow()`.
 */

export function useFollowed(subjectId: string) {
    const repo = useRepo();
    const [marks, setMarks] = useState<{ subjectId: string }[]>([]);
    const [optimistic, setOptimistic] = useState<null | boolean>(null); // null = no override

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const m = await repo.getMarks("follow");
                if (alive) setMarks(m as any);
            } catch {
                // ignore
            }
        })();
        return () => {
            alive = false;
        };
    }, [repo]);

    const isFollowed = useMemo(() => {
        if (optimistic !== null) return optimistic;
        return marks.some((m) => m.subjectId === subjectId);
    }, [marks, optimistic, subjectId]);

    const toggleFollow = async () => {
        if (isFollowed) {
            setOptimistic(false);
            try { await repo.unfollow(subjectId); } finally {}
        } else {
            setOptimistic(true);
            try { await repo.follow(subjectId); } finally {}
        }
    };

    return { isFollowed, toggleFollow };
}