import { FileSpreadsheet } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
      <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-1 text-lg font-semibold">No lists yet</h3>
      <p className="text-sm text-muted-foreground">
        Upload a CSV file above to get started
      </p>
    </div>
  );
}
