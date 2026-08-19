/**
 * CSV export. Pure string work plus one browser download — no React, no data
 * access, nothing that knows what a finding is.
 */

export interface CsvColumn<T> {
  header: string;
  /** Arrays are joined; null and undefined become empty cells. */
  value: (row: T) => string | number | string[] | null | undefined;
}

/**
 * Cells that a spreadsheet would treat as a formula rather than as text.
 *
 * A cell opening with any of these is executed on open by Excel, Sheets and
 * LibreOffice — so a package name or scanner string beginning `=` becomes code
 * running on the machine of whoever opens the export. It is a real path from
 * "scanner ingested a hostile string" to "arbitrary formula in an analyst's
 * spreadsheet", and it matters more here than in most apps: this file is
 * assembled from third-party advisory text about attackers.
 *
 * Prefixing with an apostrophe is the standard mitigation — spreadsheets treat
 * the rest as literal text and do not display the apostrophe itself.
 */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Quoting is only required for these three, so most cells pass through as-is. */
const NEEDS_QUOTING = /["\n\r,]/;

function escapeCell(raw: string | number | string[] | null | undefined): string {
  if (raw === null || raw === undefined) return '';

  // Numbers can't carry a formula and shouldn't be quoted — guarding them would
  // turn a CVSS score of -1 into the text '-1.
  if (typeof raw === 'number') return String(raw);

  const text = Array.isArray(raw) ? raw.join('; ') : raw;
  const guarded = FORMULA_PREFIX.test(text) ? `'${text}` : text;

  return NEEDS_QUOTING.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/**
 * Byte order mark.
 *
 * Excel on Windows reads a CSV as the system's legacy code page unless the file
 * announces itself, so without this every non-ASCII character in a package name
 * or advisory string arrives mojibake. Every other reader ignores it.
 */
const UTF8_BOM = '\uFEFF';

/**
 * Builds the file as an array of line strings handed straight to `Blob`.
 *
 * Deliberately never concatenated into one JS string: the full export is ~66MB
 * at 236,656 rows, and joining it costs an extra ~140ms and briefly holds both
 * the parts and the whole in memory. `Blob` takes the array and does the
 * concatenation natively, so neither cost is paid.
 *
 * Still a synchronous ~500ms pass over the rows. Callers should let the UI
 * paint a busy state before calling — see the Export button on the list page.
 */
export function buildCsvBlob<T>(rows: T[], columns: CsvColumn<T>[]): Blob {
  const parts: string[] = [UTF8_BOM + columns.map((column) => escapeCell(column.header)).join(',')];

  const cells = new Array<string>(columns.length);

  for (const row of rows) {
    for (let i = 0; i < columns.length; i += 1) {
      cells[i] = escapeCell(columns[i].value(row));
    }
    parts.push('\n' + cells.join(','));
  }

  return new Blob(parts, { type: 'text/csv;charset=utf-8;' });
}

/**
 * Triggers a download of `blob` as `filename`.
 *
 * The object URL is revoked on the next task rather than immediately: revoking
 * in the same tick as the click races the browser's own read of the URL, and
 * some browsers cancel the download. Not revoking at all leaks the whole 66MB
 * for the life of the document.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
