// src/features/marks/FollowEye.tsx
import { Eye } from "lucide-react";
import { useFollowed } from "./useFollowed";

export function FollowEye({ subjectId, kind, label, variant = "pill" }: { subjectId: string; kind: "need" | "protocol" | "suite"; label?: string; variant?: "pill" | "circle" }) {
    const { isFollowed, toggleFollow } = useFollowed(subjectId, kind);

    const baseClasses = "inline-flex items-center justify-center transition-colors border";
    const shapeClasses = variant === "circle" 
        ? "rounded-full p-2" 
        : "rounded-xl px-2 py-1 gap-1 text-xs";
        
    const colorClasses = isFollowed 
        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" 
        : "bg-transparent border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300";

    return (
        <button
            onClick={toggleFollow}
            aria-pressed={isFollowed}
            aria-label={label ?? "Follow"}
            title={isFollowed ? "Following" : "Follow"}
            className={`${baseClasses} ${shapeClasses} ${colorClasses}`}
            >
            <Eye className={`${variant === "circle" ? "h-4 w-4" : "h-3.5 w-3.5"} ${isFollowed ? "text-green-700" : "text-gray-400"}`} />
            <span className="sr-only">{isFollowed ? "Following" : "Follow"}</span>
        </button>
    );
}