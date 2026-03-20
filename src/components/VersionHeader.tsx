import React from "react";
import { Stage } from "@/domain/types";
import { formatVersion } from "@/lib/version";
import { StatusBadge } from "./StatusBadge";

export function VersionHeader({ 
  versionString, 
  uiStage, 
  uiStageDisplay, 
  language,
  switcher 
}: {
  versionString: string,
  uiStage: Stage,
  uiStageDisplay: string,
  language?: string,
  switcher?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 w-full mb-6">
        <div className="flex items-center gap-2.5">
            <StatusBadge version={`v${formatVersion(versionString)}`} stage="stable" type="version" /> 
            <StatusBadge version={uiStageDisplay} stage={uiStage} type="status" />
            {language && (
                <StatusBadge version={language} stage="stable" type="language" />
            )}
        </div>
        {switcher}
    </div>
  )
}
