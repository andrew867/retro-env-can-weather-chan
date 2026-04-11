/**
 * Playwright `addInitScript` — replaces `EventSource` so `/weather/live` and `/weather/alerts/stream`
 * never hit the network (deterministic fixtures). Reads `window.__PW_STATION__` set by the test.
 */
(() => {
  const station = window.__PW_STATION__;
  if (!station) return;

  class MockEventSource {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 2;

    constructor(url) {
      this.url = String(url);
      this.readyState = MockEventSource.OPEN;
      this.onopen = null;
      this.onerror = null;
      this.onmessage = null;
      /** @type {Map<string, Set<(ev: { data: string }) => void>>} */
      this._listeners = new Map();

      queueMicrotask(() => {
        try {
          if (typeof this.onopen === "function") this.onopen({});
        } catch {
          /* ignore */
        }

        const emit = (type, dataObj) => {
          const data = typeof dataObj === "string" ? dataObj : JSON.stringify(dataObj);
          const set = this._listeners.get(type);
          if (!set) return;
          for (const fn of set) {
            try {
              fn({ data });
            } catch {
              /* ignore */
            }
          }
        };

        if (this.url.includes("weather/live")) {
          emit("condition_update", station);
          emit("forecast_update", {
            forecast: station.forecast,
            fetchedAt: station.fetchedAt ?? null,
            observationID: station.observationID,
            stationTime: station.stationTime,
          });
        } else if (this.url.includes("init/stream")) {
          /* no synthetic crawler/init_refresh — avoids refetch churn during screenshot stability checks */
        } else if (this.url.includes("alerts/stream")) {
          emit("alerts_update", { alerts: [] });
        }
      });
    }

    addEventListener(type, fn) {
      if (!this._listeners.has(type)) this._listeners.set(type, new Set());
      this._listeners.get(type).add(fn);
    }

    removeEventListener() {}

    close() {
      this.readyState = MockEventSource.CLOSED;
    }
  }

  window.EventSource = MockEventSource;
})();
