import {
  SOLAR_CYCLE_SWPC_POLL_MS,
  SWPC_OBSERVED_SOLAR_CYCLE_INDICES_JSON_URL,
  SWPC_OBSERVED_SSN_JSON_URL,
  SWPC_PREDICTED_SOLAR_CYCLE_JSON_URL,
} from "consts/solarCycleSwpc.consts";
import { NWS_GRIDPOINT_FORECAST_USER_AGENT } from "consts/sunspots.consts";
import axios from "lib/backendAxios";
import Logger from "lib/logger";
import type { SolarCycleSwpcData } from "types";
import { pickLastDailySsn, pickLastMonthlyIndices, pickPredictedForUtcMonth } from "./parseSwpcSolarCycle";

const logger = new Logger("SolarCycleSwpc");

const jsonHeaders = { headers: { "User-Agent": NWS_GRIDPOINT_FORECAST_USER_AGENT } };

class SolarCycleSwpcFeed {
  private _daily: SolarCycleSwpcData["daily"] = null;
  private _monthlyObserved: SolarCycleSwpcData["monthlyObserved"] = null;
  private _monthlyPredicted: SolarCycleSwpcData["monthlyPredicted"] = null;
  private _fetchedAt: string | null = null;
  private _busy = false;

  constructor() {
    if (process.env.NODE_ENV === "test") return;
    void this.refresh();
    setInterval(() => void this.refresh(), SOLAR_CYCLE_SWPC_POLL_MS);
  }

  public async refresh(): Promise<void> {
    if (this._busy) return;
    this._busy = true;
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    let anyOk = false;

    try {
      const [ssnRes, idxRes, predRes] = await Promise.allSettled([
        axios.get<unknown>(SWPC_OBSERVED_SSN_JSON_URL, jsonHeaders),
        axios.get<unknown>(SWPC_OBSERVED_SOLAR_CYCLE_INDICES_JSON_URL, jsonHeaders),
        axios.get<unknown>(SWPC_PREDICTED_SOLAR_CYCLE_JSON_URL, jsonHeaders),
      ]);

      if (ssnRes.status === "fulfilled") {
        const d = pickLastDailySsn(ssnRes.value.data);
        if (d) {
          this._daily = d;
          anyOk = true;
        }
      } else {
        logger.error("SWPC observed SSN fetch failed", ssnRes.reason);
      }

      if (idxRes.status === "fulfilled") {
        const mo = pickLastMonthlyIndices(idxRes.value.data);
        if (mo) {
          this._monthlyObserved = mo;
          anyOk = true;
        }
      } else {
        logger.error("SWPC observed solar-cycle indices fetch failed", idxRes.reason);
      }

      if (predRes.status === "fulfilled") {
        const pr = pickPredictedForUtcMonth(predRes.value.data, y, m);
        if (pr) {
          this._monthlyPredicted = pr;
          anyOk = true;
        }
      } else {
        logger.error("SWPC predicted solar-cycle fetch failed", predRes.reason);
      }

      if (anyOk) {
        this._fetchedAt = new Date().toISOString();
        logger.log("SWPC solar-cycle snapshot updated");
      }
    } finally {
      this._busy = false;
    }
  }

  public getData(): SolarCycleSwpcData {
    return {
      daily: this._daily,
      monthlyObserved: this._monthlyObserved,
      monthlyPredicted: this._monthlyPredicted,
    };
  }

  public getLastFetchIso(): string | null {
    return this._fetchedAt;
  }

  public requestOperatorRefresh(): void {
    void this.refresh();
  }
}

let solarCycleSwpcFeed: SolarCycleSwpcFeed | null = null;

export function initializeSolarCycleSwpc(): SolarCycleSwpcFeed {
  if (!solarCycleSwpcFeed) solarCycleSwpcFeed = new SolarCycleSwpcFeed();
  return solarCycleSwpcFeed;
}
