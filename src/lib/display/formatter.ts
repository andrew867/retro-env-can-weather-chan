import { DISPLAY_MAX_CHARACTERS_PER_LINE } from "consts";

/** Collapse ECCC / XML whitespace (incl. newlines) into single spaces for one continuous forecast paragraph. */
export function normalizeForecastPlaintext(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Fills up to `maxLines` rows of at most `width` characters (default 32).
 * Breaks at spaces when possible; otherwise hard-breaks within a word.
 */
export function wrapTextToLineBudget(
  text: string,
  maxLines: number,
  width: number = DISPLAY_MAX_CHARACTERS_PER_LINE
): { lines: string[]; remainder: string } {
  let remainder = text.replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  while (lines.length < maxLines && remainder.length > 0) {
    if (remainder.length <= width) {
      lines.push(remainder);
      remainder = "";
      break;
    }
    const slice = remainder.slice(0, width);
    const lastSpace = slice.lastIndexOf(" ");
    if (lastSpace > 0) {
      lines.push(remainder.slice(0, lastSpace).trimEnd());
      remainder = remainder.slice(lastSpace).trimStart();
    } else {
      lines.push(remainder.slice(0, width));
      remainder = remainder.slice(width).trimStart();
    }
  }
  return { lines, remainder };
}

/**
 * Word-wraps `text` into one or more pages; each page is newline-separated lines.
 * First page allows `linesFirstPage` rows; later pages use `linesContinuationPage` rows.
 */
export function paginateText8x32(
  text: string,
  linesFirstPage: number,
  linesContinuationPage: number,
  width: number = DISPLAY_MAX_CHARACTERS_PER_LINE
): string[] {
  const normalized = normalizeForecastPlaintext(text);
  if (!normalized) return [];

  const pages: string[] = [];
  let remainder = normalized;

  const first = wrapTextToLineBudget(remainder, linesFirstPage, width);
  pages.push(first.lines.join("\n"));
  remainder = first.remainder;
  while (remainder.length > 0) {
    const chunk = wrapTextToLineBudget(remainder, linesContinuationPage, width);
    pages.push(chunk.lines.join("\n"));
    remainder = chunk.remainder;
  }
  return pages.filter((p) => p.length > 0);
}

export function formatStringTo8x32(text: string, maxLines: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= DISPLAY_MAX_CHARACTERS_PER_LINE) return normalized;

  const { lines } = wrapTextToLineBudget(normalized, maxLines);
  return lines.join("\n").trimEnd();
}
