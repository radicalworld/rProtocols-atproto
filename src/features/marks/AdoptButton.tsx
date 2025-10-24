import { CheckSquare, Square } from "lucide-react";
import { useAdopted } from "./useAdopted";

/**
 * Stylized Adopt button: light gray when inactive, green when adopted.
 */
export function AdoptButton({ subjectId, label, disabled }: { subjectId: string; label?: string; disabled?: boolean }) {
    const { adopted, toggleAdopt } = useAdopted(subjectId);

    return (
        <button
            onClick={toggleAdopt}
            disabled={disabled}
            aria-pressed={adopted}
            aria-label={label ?? "Adopt"}
            title={adopted ? "Adopted" : "Adopt"}
            className={`inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-xs transition-colors
                ${disabled
                    ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                    : adopted
                        ? "bg-green-200 text-green-800 border-green-300 hover:bg-green-300"
                        : "bg-transparent border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"}`}
                    >
            {adopted ? (
                <CheckSquare className="h-3.5 w-3.5 text-green-800" />
            ) : (
                <Square className="h-3.5 w-3.5 text-gray-400" />
            )}
            <span className="sr-only">{adopted ? "Adopted" : "Adopt"}</span>
        </button>
    );
}