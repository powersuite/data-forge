"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  SplitSquareVertical,
  CaseSensitive,
  Phone,
  Mail,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { CleanupSummary } from "@/types";

interface CleanupSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: CleanupSummary | null;
}

const items = [
  { key: "namesSplit" as const, label: "Names split", icon: SplitSquareVertical },
  { key: "capsFixed" as const, label: "Capitalization fixed", icon: CaseSensitive },
  { key: "phonesFormatted" as const, label: "Phones formatted", icon: Phone },
  { key: "emailsClassified" as const, label: "Emails classified", icon: Mail },
  { key: "duplicatesFound" as const, label: "Duplicates flagged", icon: Copy },
  { key: "missingFlagged" as const, label: "Missing fields flagged", icon: AlertTriangle },
];

export function CleanupSummaryDialog({
  open,
  onOpenChange,
  summary,
}: CleanupSummaryDialogProps) {
  if (!summary) return null;

  const total = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cleanup Complete</DialogTitle>
          <DialogDescription>
            {total > 0
              ? `Made ${total.toLocaleString()} changes across your data.`
              : "No changes were needed — your data looks clean!"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {items.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              <span className="font-medium tabular-nums">
                {summary[key].toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <Button onClick={() => onOpenChange(false)} className="w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
