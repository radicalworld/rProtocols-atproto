import { Link } from "react-router-dom";
import { Edit, GitFork } from "lucide-react";
import { FollowEye } from "./FollowEye";
import { AdoptButton } from "./AdoptButton";
import { useSession } from "@/features/auth/SessionProvider";

interface ProfileActionsProps {
    subjectId: string;
    editUrl?: string;
    newUrl?: string;
    editTitle?: string;
    followLabel?: string;
    showAdopt?: boolean;
    adoptDisabled?: boolean;
}

export function ProfileActions({ 
    subjectId, 
    editUrl, 
    newUrl,
    editTitle = "Edit", 
    followLabel = "Follow", 
    showAdopt = false, 
    adoptDisabled = false 
}: ProfileActionsProps) {
    const { session } = useSession();

    return (
        <div className="flex items-center gap-2 shrink-0 mt-1">
            {session && editUrl && (
                <>
                <Link
                    to={editUrl}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                    title={editTitle}
                >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">{editTitle}</span>
                </Link>
                {newUrl ? (
                <Link
                    to={`${newUrl}?forkFrom=${encodeURIComponent(subjectId)}`}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                    title="Fork to new lineage"
                >
                    <GitFork className="h-4 w-4" />
                    <span className="sr-only">Fork to new lineage</span>
                </Link>
                ) : (
                <Link
                    to={`${editUrl}?fork=true`}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                    title="Fork version"
                >
                    <GitFork className="h-4 w-4" />
                    <span className="sr-only">Fork version</span>
                </Link>
                )}
                </>
            )}
            <FollowEye subjectId={subjectId} label={followLabel} variant="circle" />
            {showAdopt && (
                <AdoptButton subjectId={subjectId} disabled={adoptDisabled} variant="circle" />
            )}
        </div>
    );
}
