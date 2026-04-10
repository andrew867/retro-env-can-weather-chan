import { SOLAR_FLUX_POLL_MS, SOLAR_FLUX_TABLE_URL } from "consts/solarFlux.consts";
import axios from "lib/backendAxios";
import Logger from "lib/logger";
import type { SolarFluxLatest } from "types";
import { latestFluxFromTableText } from "./parseFluxTable";

const logger = new Logger("SolarFlux");

class SolarFluxFeed {
  private _latest: SolarFluxLatest | null = null;
  private _fetchedAt: string | null = null;
  private _busy = false;

  constructor() {
    if (process.env.NODE_ENV === "test") return;
    void this.refresh();
    setInterval(() => void this.refresh(), SOLAR_FLUX_POLL_MS);
  }

  public async refresh(): Promise<void> {
    if (this._busy) return;
    this._busy = true;
    try {
      const { data } = await axios.get<string>(SOLAR_FLUX_TABLE_URL, { responseType: "text" });
      const raw = typeof data === "string" ? data : String(data ?? "");
      const latest = latestFluxFromTableText(raw);
      if (!latest) {
        logger.warn("Solar flux table contained no parseable rows");
        return;
      }
      this._latest = latest;
      this._fetchedAt = new Date().toISOString();
      logger.log("Solar flux updated", latest.fluxDate, latest.fluxTime, latest.adjustedSfU, "SFU adj");
    } catch (e) {
      logger.error("Solar flux fetch failed", e);
    } finally {
      this._busy = false;
    }
  }

  public getLatest(): SolarFluxLatest | null {
    return this._latest;
  }

  public getLastFetchIso(): string | null {
    return this._fetchedAt;
  }

  public requestOperatorRefresh(): void {
    void this.refresh();
  }
}

let solarFluxFeed: SolarFluxFeed | null = null;

export function initializeSolarFlux(): SolarFluxFeed {
  if (!solarFluxFeed) solarFluxFeed = new SolarFluxFeed();
  return solarFluxFeed;
}
