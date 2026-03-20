import { CheckCircle, Circle } from "lucide-react";
import { useAdopted } from "./useAdopted";

/**
 * Stylized Adopt button: light gray when inactive, green when adopted.
 */
export function AdoptButton({ subjectId, kind, label, disabled, variant = "pill" }: { subjectId: string; kind: "need" | "protocol" | "suite"; label?: string; disabled?: boolean; variant?: "pill" | "circle" }) {
    const { adopted, toggleAdopt } = useAdopted(subjectId, kind);

    const baseClasses = "inline-flex items-center justify-center transition-colors border";
    const shapeClasses = variant === "circle" 
        ? "rounded-full p-2" 
        : "rounded-xl px-2 py-1 gap-1 text-xs";
        
    const colorClasses = disabled
        ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
        : adopted
            ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
            : "bg-transparent border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300";

    return (
        <button
            onClick={toggleAdopt}
            disabled={disabled}
            aria-pressed={adopted}
            aria-label={label ?? "Adopt"}
            title={adopted ? "Adopted" : "Adopt"}
            className={`${baseClasses} ${shapeClasses} ${colorClasses}`}
                    >
            {adopted ? (
                <CheckCircle className={`${variant === "circle" ? "h-4 w-4" : "h-3.5 w-3.5"} text-green-700`} />
            ) : (
                <Circle className={`${variant === "circle" ? "h-4 w-4" : "h-3.5 w-3.5"} text-gray-400`} />
            )}
            <span className="sr-only">{adopted ? "Adopted" : "Adopt"}</span>
        </button>
    );
}