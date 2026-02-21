"use client";

import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { EnrichmentProgress as EnrichmentProgressType } from "@/types";

interface EnrichmentProgressProps {
  progress: EnrichmentProgressType;
}

export function EnrichmentProgress({ progress }: EnrichmentProgressProps) {
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">{progress.step}</span>
          <span className="text-muted-foreground tabular-nums">
            {progress.current}/{progress.total}
            {progress.errors > 0 && (
              <span className="ml-1 text-red-500">({progress.errors} errors)</span>
            )}
          </span>
        </div>
        <Progress value={percent} className="h-1.5" />
      </div>
    </div>
  );
}
