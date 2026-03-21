import React from "react";
import { Stage } from "@/domain/types";
import { formatVersion } from "@/lib/version";
import { StatusBadge } from "./StatusBadge";

export function VersionHeader({ 
  versionString, 
  uiStage, 
  uiStageDisplay, 
  language,
  isPendingFork,
  switcher 
}: {
  versionString: string,
  uiStage: Stage,
  uiStageDisplay: string,
  language?: string,
  isPendingFork?: boolean,
  switcher?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 w-full mb-6">
        <div className="flex items-center gap-2.5">
            <StatusBadge 
                version={isPendingFork ? "v?.0.0" : `v${formatVersion(versionString)}`} 
                stage={isPendingFork ? "draft" : "stable"} 
                type="version" 
            /> 
            <StatusBadge version={uiStageDisplay} stage={uiStage} type="status" />
            {language && (
                <StatusBadge version={language} stage="stable" type="language" />
            )}
        </div>
        {switcher}
    </div>
  )
}
