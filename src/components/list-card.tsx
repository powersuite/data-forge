"use client";

import Link from "next/link";
import { FileSpreadsheet, CheckCircle2, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List } from "@/types";

interface ListCardProps {
  list: List;
}

export function ListCard({ list }: ListCardProps) {
  const date = new Date(list.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const summary = list.enrichment_summary;
  const enrichedSubtext = summary
    ? [
        summary.contactsExtracted > 0 && `${summary.contactsExtracted} contacts`,
        (summary.emailsFound + summary.patternsGenerated) > 0 && `${summary.emailsFound + summary.patternsGenerated} emails`,
        summary.validEmails > 0 && `${summary.validEmails} valid`,
      ]
        .filter(Boolean)
        .join(" \u00b7 ")
    : null;

  return (
    <Link href={`/list/${list.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{list.name}</p>
            <p className="text-xs text-muted-foreground">
              {list.row_count.toLocaleString()} rows &middot; {list.columns.length} columns &middot; {date}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge
              variant={list.enriched ? "default" : list.cleaned ? "default" : "secondary"}
            >
              {list.enriched ? (
                <><Zap className="mr-1 h-3 w-3" /> Enriched</>
              ) : list.cleaned ? (
                <><CheckCircle2 className="mr-1 h-3 w-3" /> Cleaned</>
              ) : (
                <><Clock className="mr-1 h-3 w-3" /> Raw</>
              )}
            </Badge>
            {enrichedSubtext && (
              <span className="text-[10px] text-muted-foreground">
                {enrichedSubtext}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
