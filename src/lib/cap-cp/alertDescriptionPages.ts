import { paginateText8x32 } from "lib/display";

const LINES_PER_ALERT_PAGE = 7;

/** Strip CAP boilerplate / markdown-ish blocks; keep readable running text for 8×32 pagination. */
export function extractCapDescriptionPlaintext(description: string): string {
  if (!description?.length) return "";

  const paragraphSplit = description.split(/.\s\s/).map((paragraph) => paragraph.trim());
  const joined = paragraphSplit.join(". ").trim();
  const [relevantDescription] = joined.split(/\n+###|\s+##/gi);
  const beforeLocations = relevantDescription.replace(/\n+/g, " ").split(/locations impacted/gi)[0];
  return beforeLocations.replace(/\s+/g, " ").trim();
}

/** One rotator page per chunk, same headline timing as the first page (caller may suffix “cont.”). */
export function paginateAlertDescriptionToPages(description: string, linesPerPage = LINES_PER_ALERT_PAGE): string[] {
  const plain = extractCapDescriptionPlaintext(description);
  if (!plain) return [];
  return paginateText8x32(plain, linesPerPage, linesPerPage);
}
