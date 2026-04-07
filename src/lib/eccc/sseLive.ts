import { Request, Response } from "express";

export type ConditionsSseOptions = {
  /** Milliseconds between automatic pushes (same cadence as legacy channel). */
  intervalMs: number;
  /** SSE event name the display listens for (e.g. `condition_update`). */
  eventName: string;
  /** Snapshot builder; called on each tick (must be safe if client disconnected). */
  getData: () => unknown;
};

/**
 * One SSE connection = one interval. Cleans up on client disconnect.
 * Replaces a previous global interval that broke multi-client and OBS reconnects.
 */
export function attachConditionsSse(req: Request, res: Response, options: ConditionsSseOptions): void {
  const { intervalMs, eventName, getData } = options;

  res.writeHead(200, {
    connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  let cleaned = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (interval !== undefined) clearInterval(interval);
  };

  const push = () => {
    if (cleaned || res.writableEnded) {
      cleanup();
      return;
    }
    try {
      const payload = getData();
      res.write(`id: ${Date.now()}\n`);
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      cleanup();
      try {
        res.end();
      } catch {
        /* ignore */
      }
    }
  };

  push();
  interval = setInterval(push, intervalMs);

  req.on("close", cleanup);
  res.on("close", cleanup);
}
