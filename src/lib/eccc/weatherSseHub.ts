import { Request, Response } from "express";
import eventbus from "lib/eventbus";
import {
  CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT,
  CONDITIONS_EVENT_STREAM_FORECAST_UPDATE_EVENT,
  EVENT_BUS_AUXILIARY_WEATHER_DATA_READY,
  EVENT_BUS_MAIN_STATION_UPDATE_NEW_CONDITIONS,
  SSE_WEATHER_HEARTBEAT_MS,
} from "consts";

type SnapshotGetters = {
  getObserved: () => unknown;
  getForecast: () => unknown;
};

const clients = new Set<Response>();
let getters: SnapshotGetters | null = null;
let busRegistered = false;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function writeEvent(res: Response, event: string, data: unknown) {
  res.write(`id: ${Date.now()}\n`);
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function ensureBus(snapshot: SnapshotGetters) {
  getters = snapshot;
  if (busRegistered) return;
  busRegistered = true;
  eventbus.on(EVENT_BUS_MAIN_STATION_UPDATE_NEW_CONDITIONS, () => {
    broadcastWeatherLive();
  });
  eventbus.on(EVENT_BUS_AUXILIARY_WEATHER_DATA_READY, () => {
    broadcastWeatherLive();
  });
}

/** Push latest citypage snapshot to all `/weather/live` tabs (MSC AMQP → parse → event bus). */
export function broadcastWeatherLive() {
  if (!getters) return;
  const observed = getters.getObserved();
  const forecast = getters.getForecast();
  for (const res of [...clients]) {
    if (res.writableEnded) {
      clients.delete(res);
      continue;
    }
    try {
      writeEvent(res, CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT, observed);
      writeEvent(res, CONDITIONS_EVENT_STREAM_FORECAST_UPDATE_EVENT, forecast);
    } catch {
      clients.delete(res);
    }
  }
}

function ensureHeartbeat() {
  if (heartbeatTimer !== null) return;
  heartbeatTimer = setInterval(() => {
    for (const res of [...clients]) {
      if (res.writableEnded) {
        clients.delete(res);
        continue;
      }
      try {
        res.write(`: ping\n\n`);
      } catch {
        clients.delete(res);
      }
    }
  }, SSE_WEATHER_HEARTBEAT_MS);
}

/**
 * Push-driven weather SSE: immediate snapshot on connect, then on each new citypage parse.
 * Forecast text is included in `condition_update` (observed) and duplicated in `forecast_update` for subscribers that only care about forecast.
 */
export function registerWeatherLiveClient(req: Request, res: Response, snapshot: SnapshotGetters): void {
  res.writeHead(200, {
    connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  ensureBus(snapshot);
  ensureHeartbeat();

  clients.add(res);
  try {
    writeEvent(res, CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT, snapshot.getObserved());
    writeEvent(res, CONDITIONS_EVENT_STREAM_FORECAST_UPDATE_EVENT, snapshot.getForecast());
  } catch {
    clients.delete(res);
    try {
      res.end();
    } catch {
      /* ignore */
    }
    return;
  }

  const cleanup = () => {
    clients.delete(res);
  };
  req.on("close", cleanup);
  res.on("close", cleanup);
}
