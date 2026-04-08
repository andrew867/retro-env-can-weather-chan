/**
 * Shallow merge where keys in `patch` with value `undefined` are skipped.
 * Prevents `{ ...prev, ...parsed }` from wiping nested SSE fields when the server omits them.
 */
export function mergeDefined<T extends Record<string, unknown>>(prev: T, patch: Partial<T>): T {
  const out = { ...prev };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const v = patch[key];
    if (v !== undefined) {
      (out as Record<string, unknown>)[key as string] = v as unknown;
    }
  }
  return out;
}
