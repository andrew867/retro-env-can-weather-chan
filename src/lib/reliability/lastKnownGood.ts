/** In-memory last-known-good snapshot with wall-clock expiry. */
export class LastKnownGood<T> {
  private _value: T | null = null;
  private _savedAtMs: number | null = null;

  save(value: T): void {
    this._value = value;
    this._savedAtMs = Date.now();
  }

  getIfFresh(maxAgeMs: number): T | null {
    if (this._value == null || this._savedAtMs == null) return null;
    if (Date.now() - this._savedAtMs > maxAgeMs) return null;
    return this._value;
  }

  get savedAtIso(): string | null {
    return this._savedAtMs != null ? new Date(this._savedAtMs).toISOString() : null;
  }

  clear(): void {
    this._value = null;
    this._savedAtMs = null;
  }
}
