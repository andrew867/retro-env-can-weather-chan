/**
 * Defensive helpers so malformed JSON / partial API payloads do not crash display code
 * (e.g. `.map` / `.length` on non-arrays).
 */

export function coerceArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Config / playlist lines: accept string[] or a single string; never throw. */
export function coerceStringLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((x) => (typeof x === "string" ? x : String(x ?? "")));
  }
  if (typeof value === "string") return [value];
  return [];
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
