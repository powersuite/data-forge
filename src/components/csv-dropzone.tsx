"use client";

import { useCallback, useState } from "react";
import { Upload, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CSVDropzoneProps {
  onFileAccepted: (file: File) => void;
  isUploading: boolean;
}

export function CSVDropzone({ onFileAccepted, isUploading }: CSVDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].name.endsWith(".csv")) {
        onFileAccepted(files[0]);
      }
    },
    [onFileAccepted]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileAccepted(files[0]);
      }
      e.target.value = "";
    },
    [onFileAccepted]
  );

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        isUploading && "pointer-events-none opacity-60"
      )}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="absolute inset-0 cursor-pointer opacity-0"
        disabled={isUploading}
      />
      {isUploading ? (
        <>
          <FileUp className="mb-3 h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm font-medium">Uploading...</p>
        </>
      ) : (
        <>
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">
            Drag & drop a CSV file here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports .csv files of any size
          </p>
        </>
      )}
    </div>
  );
}
