"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { parseCSV } from "@/lib/csv-parser";
import { BATCH_SIZE } from "@/lib/constants";
import { List } from "@/types";
import { CSVDropzone } from "@/components/csv-dropzone";
import { ListCard } from "@/components/list-card";
import { EmptyState } from "@/components/empty-state";

export default function HomePage() {
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("lists")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setLists(data as List[]);
        setLoaded(true);
      });
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const { headers, rows } = await parseCSV(file);
        if (rows.length === 0) {
          toast.error("CSV file is empty");
          setIsUploading(false);
          return;
        }

        // Create list record
        const listName = file.name.replace(/\.csv$/i, "");
        const { data: list, error: listError } = await supabase
          .from("lists")
          .insert({
            name: listName,
            columns: headers,
            row_count: rows.length,
            cleaned: false,
          })
          .select()
          .single();

        if (listError || !list) {
          throw new Error(listError?.message ?? "Failed to create list");
        }

        // Insert rows in batches
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE).map((data, idx) => ({
            list_id: list.id,
            row_index: i + idx,
            data,
            flags: {},
            is_duplicate: false,
          }));

          const { error } = await supabase.from("list_rows").insert(batch);
          if (error) throw new Error(error.message);
        }

        toast.success(`Uploaded ${rows.length.toLocaleString()} rows`);
        router.push(`/list/${list.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
        setIsUploading(false);
      }
    },
    [router]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold">Upload a CSV</h1>
        <p className="text-sm text-muted-foreground">
          Drop your file below to clean, enrich, and export your data
        </p>
      </div>

      <CSVDropzone onFileAccepted={handleFile} isUploading={isUploading} />

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Your Lists</h2>
        {loaded && lists.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {lists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
