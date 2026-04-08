import { Request, Response } from "express";
import eventbus from "lib/eventbus";
import { ALERTS_SSE_UPDATE_EVENT, EVENT_BUS_ALERTS_UPDATED } from "consts";

const clients = new Set<Response>();
let getPayload: (() => unknown) | null = null;
let busRegistered = false;

function writeAlertsEvent(res: Response, data: unknown) {
  res.write(`id: ${Date.now()}\n`);
  res.write(`event: ${ALERTS_SSE_UPDATE_EVENT}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcastAlerts() {
  if (!getPayload) return;
  const data = getPayload();
  for (const res of [...clients]) {
    if (res.writableEnded) {
      clients.delete(res);
      continue;
    }
    try {
      writeAlertsEvent(res, data);
    } catch {
      clients.delete(res);
    }
  }
}

function ensureBus(getAlerts: () => unknown) {
  getPayload = getAlerts;
  if (busRegistered) return;
  busRegistered = true;
  eventbus.on(EVENT_BUS_ALERTS_UPDATED, () => {
    broadcastAlerts();
  });
}

export function registerAlertsLiveClient(req: Request, res: Response, getAlerts: () => unknown): void {
  res.writeHead(200, {
    connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  ensureBus(getAlerts);
  clients.add(res);
  try {
    writeAlertsEvent(res, getAlerts());
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
