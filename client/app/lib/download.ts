import { fetchBlob } from "./fetcher";

/**
 * Replaces whitespace and characters that are illegal in filenames
 * (/ \ : * ? " < > |) with underscores, so a value can be used safely in a
 * download filename or Content-Disposition header.
 */
export function sanitizeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|\s]/g, "_");
}

/**
 * Builds a PDF download filename in the form `{client}_{KIND}_{number}.pdf`,
 * falling back to `{KIND}_{number}.pdf` when the client name is missing. Both
 * the client name and number are sanitized to be filesystem-safe.
 */
export function buildPdfFilename(
  clientName: string | undefined | null,
  kind: "INVOICE" | "ESTIMATE",
  number: string,
): string {
  const safeNumber = sanitizeFilename(number);
  const client = clientName?.trim();
  return client
    ? `${sanitizeFilename(client)}_${kind}_${safeNumber}.pdf`
    : `${kind}_${safeNumber}.pdf`;
}

/**
 * Triggers a browser "Save as" download of `blob` under `filename` using a
 * temporary object URL + anchor, then revokes the URL. This is the reusable
 * download step: pair it with {@link fetchBlob} (or use {@link downloadFile})
 * anywhere a server response needs to land as a file on disk.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Fetches a binary resource from `path` (through the shared fetch wrapper, so
 * it honors the same base URL as the rest of the client) and saves it as
 * `filename`. Throws on a non-OK response so callers can surface the error.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const blob = await fetchBlob(path);
  saveBlob(blob, filename);
}
