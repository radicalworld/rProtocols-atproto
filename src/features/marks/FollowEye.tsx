// src/features/marks/FollowEye.tsx
import { Eye } from "lucide-react";
import { useFollowed } from "./useFollowed";

export function FollowEye({ subjectId, label }: { subjectId: string; label?: string }) {
    const { isFollowed, toggleFollow } = useFollowed(subjectId);

    return (
        <button
            onClick={toggleFollow}
            aria-pressed={isFollowed}
            aria-label={label ?? "Follow"}
            title={isFollowed ? "Following" : "Follow"}
            className={`inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-xs transition-colors
                ${isFollowed 
                    ? "bg-green-200 text-green-800 border-green-300 hover:bg-green-300" 
                    : "bg-transparent border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"}`}
            >
            <Eye className={`h-3.5 w-3.5 ${isFollowed ? "text-green-800" : "text-gray-400"}`} />
            <span className="sr-only">{isFollowed ? "Following" : "Follow"}</span>
        </button>
    );
}