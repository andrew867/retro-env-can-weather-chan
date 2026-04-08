import { Response } from "express";
import { INIT_SSE_CRAWLER_EVENT } from "consts";

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

/** Push new crawler lines to all connected display tabs (JSON body: `{ crawler: string[] }`). */
export function broadcastCrawlerUpdate(crawler: string[]): void {
  const payload = JSON.stringify({ crawler });
  for (const res of [...clients]) {
    if (res.writableEnded) {
      clients.delete(res);
      continue;
    }
    try {
      res.write(`id: ${Date.now()}\n`);
      res.write(`event: ${INIT_SSE_CRAWLER_EVENT}\n`);
      res.write(`data: ${payload}\n\n`);
    } catch {
      clients.delete(res);
    }
  }
}
