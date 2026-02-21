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

export function EnrichmentSummaryDialog({
  open,
  onOpenChange,
  summary,
}: EnrichmentSummaryDialogProps) {
  if (!summary) return null;

  const totalActions =
    summary.contactsExtracted +
    summary.emailsFound +
    summary.patternsGenerated;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enrichment Complete</DialogTitle>
          <DialogDescription>
            {totalActions > 0
              ? `Found ${summary.contactsExtracted} decision maker${summary.contactsExtracted !== 1 ? "s" : ""} and ${summary.emailsFound + summary.patternsGenerated} email${summary.emailsFound + summary.patternsGenerated !== 1 ? "s" : ""}.`
              : "No enrichment actions were needed — data already looks complete."}
          </DialogDescription>
        </DialogHeader>

        {/* Contact Extraction */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Extraction</p>
          <SummaryRow icon={UserSearch} label="Decision makers found" value={summary.contactsExtracted} />
        </div>

        {/* Email Discovery */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Discovery</p>
          <SummaryRow icon={Mail} label="Emails found (Icypeas)" value={summary.emailsFound} />
          <SummaryRow icon={FileCode2} label="Email patterns guessed" value={summary.patternsGenerated} />
        </div>

        {/* Email Verification */}
        {summary.emailsVerified > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Verification</p>
            <SummaryRow icon={CheckCircle2} label="Valid" value={summary.validEmails} color="text-green-500" />
            <SummaryRow icon={XCircle} label="Invalid" value={summary.invalidEmails} color="text-red-500" />
            <SummaryRow icon={AlertTriangle} label="Risky" value={summary.riskyEmails} color="text-yellow-500" />
            <SummaryRow icon={HelpCircle} label="Unknown" value={summary.unknownEmails} />
            <SummaryRow icon={ShieldAlert} label="Role accounts" value={summary.roleAccounts} color="text-purple-500" />
          </div>
        )}

        {/* Errors */}
        {summary.errors > 0 && (
          <SummaryRow icon={AlertOctagon} label="Errors" value={summary.errors} color="text-red-500" />
        )}

        <Button onClick={() => onOpenChange(false)} className="w-full mt-2">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm py-0.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`h-4 w-4 ${color ?? ""}`} />
        <span>{label}</span>
      </div>
      <span className={`font-medium tabular-nums ${color ?? ""}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
