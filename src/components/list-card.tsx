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
          <Badge
            variant={list.enriched ? "default" : list.cleaned ? "default" : "secondary"}
            className="shrink-0"
          >
            {list.enriched ? (
              <><Zap className="mr-1 h-3 w-3" /> Enriched</>
            ) : list.cleaned ? (
              <><CheckCircle2 className="mr-1 h-3 w-3" /> Cleaned</>
            ) : (
              <><Clock className="mr-1 h-3 w-3" /> Raw</>
            )}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
