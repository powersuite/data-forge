import Papa from "papaparse";

export function parseCSV(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete(results) {
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        resolve({ headers, rows });
      },
      error(err) {
        reject(err);
      },
    });
  });
}

export function unparseCSV(
  rows: Record<string, string>[],
  columns: string[]
): string {
  return Papa.unparse(rows, { columns });
}
