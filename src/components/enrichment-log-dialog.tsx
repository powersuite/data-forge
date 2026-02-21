"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  Globe,
  Mail,
  ShieldCheck,
  FileCode2,
  Settings2,
  Flag,
} from "lucide-react";
import { EnrichmentLogEntry } from "@/types";

interface EnrichmentLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: EnrichmentLogEntry[];
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  scrape: Globe,
  find_email: Mail,
  verify_email: ShieldCheck,
  generate_pattern: FileCode2,
  resolve_columns: Settings2,
  analyze_needs: Flag,
  complete: CheckCircle2,
};

const RESULT_STYLES: Record<string, { color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  success: { color: "text-emerald-400", Icon: CheckCircle2 },
  error: { color: "text-red-400", Icon: XCircle },
  skip: { color: "text-zinc-500", Icon: SkipForward },
};

export function EnrichmentLogDialog({ open, onOpenChange, log }: EnrichmentLogDialogProps) {
  if (!log || log.length === 0) return null;

  const errorCount = log.filter((e) => e.result === "error").length;
  const successCount = log.filter((e) => e.result === "success").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Enrichment Log</DialogTitle>
          <DialogDescription>
            {log.length} entries &middot; {successCount} succeeded &middot; {errorCount} errors
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 max-h-[60vh] rounded-md border border-zinc-800 bg-zinc-950 p-3">
          <div className="space-y-1 font-mono text-xs">
            {log.map((entry, i) => {
              const ActionIcon = ACTION_ICONS[entry.action] ?? Flag;
              const style = RESULT_STYLES[entry.result] ?? RESULT_STYLES.skip;
              const time = new Date(entry.timestamp).toLocaleTimeString();

              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 py-1 px-1.5 rounded ${
                    entry.result === "error" ? "bg-red-950/30" : ""
                  }`}
                >
                  <span className="text-zinc-600 shrink-0 w-[60px]">{time}</span>
                  <style.Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${style.color}`} />
                  <ActionIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-zinc-500" />
                  <span className="text-zinc-400 shrink-0 max-w-[140px] truncate">
                    {entry.rowLabel}
                  </span>
                  <span className="text-zinc-300 break-all">{entry.detail}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Button onClick={() => onOpenChange(false)} className="w-full mt-2">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
