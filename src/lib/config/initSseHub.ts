import { Response } from "express";
import { INIT_SSE_CRAWLER_EVENT, INIT_SSE_INIT_REFRESH_EVENT } from "consts";

const clients = new Set<Response>();

/** One SSE connection per browser tab; receives `crawler_update` when crawler lines change. */
export function registerInitSseClient(res: Response): void {
  res.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });
  clients.add(res);
  res.write(`event: connected\ndata: {}\n\n`);

  const cleanup = () => {
    clients.delete(res);
  };
  res.on("close", cleanup);
  res.on("finish", cleanup);
}

function writeSseEvent(res: Response, event: string, data: string): void {
  res.write(`id: ${Date.now()}\n`);
  res.write(`event: ${event}\n`);
  res.write(`data: ${data}\n\n`);
}

/** Push new crawler lines to all connected display tabs (JSON body: `{ crawler: string[] }`). */
export function broadcastCrawlerUpdate(crawler: string[]): void {
  const payload = JSON.stringify({ crawler });
  for (const res of [...clients]) {
    if (res.writableEnded) {
      clients.delete(res);
      continue;
    }
    try {
      writeSseEvent(res, INIT_SSE_CRAWLER_EVENT, payload);
    } catch {
      clients.delete(res);
    }
  }
}

/** After config changes that affect `GET /init` (graphics, etc.), refetch so the display is not stuck on a 30s poll. */
export function broadcastInitRefresh(): void {
  const payload = "{}";
  for (const res of [...clients]) {
    if (res.writableEnded) {
      clients.delete(res);
      continue;
    }
    try {
      writeSseEvent(res, INIT_SSE_INIT_REFRESH_EVENT, payload);
    } catch {
      clients.delete(res);
    }
  }
}
