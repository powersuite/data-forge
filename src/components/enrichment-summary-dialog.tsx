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
  UserSearch,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  FileCode2,
  AlertOctagon,
} from "lucide-react";
import { EnrichmentSummary } from "@/types";

interface EnrichmentSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: EnrichmentSummary | null;
}

const items = [
  { key: "contactsExtracted" as const, label: "Contacts extracted", icon: UserSearch },
  { key: "emailsFound" as const, label: "Emails found", icon: Mail },
  { key: "emailsVerified" as const, label: "Emails verified", icon: CheckCircle2 },
  { key: "validEmails" as const, label: "Valid emails", icon: CheckCircle2 },
  { key: "invalidEmails" as const, label: "Invalid emails", icon: XCircle },
  { key: "riskyEmails" as const, label: "Risky emails", icon: AlertTriangle },
  { key: "unknownEmails" as const, label: "Unknown status", icon: HelpCircle },
  { key: "roleAccounts" as const, label: "Role accounts", icon: ShieldAlert },
  { key: "patternsGenerated" as const, label: "Pattern guesses", icon: FileCode2 },
  { key: "errors" as const, label: "Errors", icon: AlertOctagon },
];

export function EnrichmentSummaryDialog({
  open,
  onOpenChange,
  summary,
}: EnrichmentSummaryDialogProps) {
  if (!summary) return null;

  const total =
    summary.contactsExtracted +
    summary.emailsFound +
    summary.emailsVerified;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enrichment Complete</DialogTitle>
          <DialogDescription>
            {total > 0
              ? `Enriched data across your list with ${total} actions.`
              : "No enrichment actions were needed."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {items.map(({ key, label, icon: Icon }) => {
            const value = summary[key];
            if (value === 0 && key === "errors") return null;
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </div>
                <span className="font-medium tabular-nums">
                  {value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
        <Button onClick={() => onOpenChange(false)} className="w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}
