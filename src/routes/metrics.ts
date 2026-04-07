import express, { NextFunction, Request, Response } from "express";
import { setClientMetricsReport } from "lib/clientMetricsLastReport";
import type { OutboundAxiosMetricsBucket } from "lib/upstreamMetrics";
import { getUpstreamMetricsSnapshot } from "lib/upstreamMetrics";

const router = express.Router();

const metricsToken = process.env.RWC_METRICS_TOKEN?.trim();

router.use((_req: Request, res: Response, next: NextFunction) => {
  if (!metricsToken) return next();
  const auth = _req.headers.authorization;
  if (auth !== `Bearer ${metricsToken}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

router.get("/", (_req: Request, res: Response) => {
  res.json(getUpstreamMetricsSnapshot());
});

function isOutboundAxiosBucket(body: unknown): body is OutboundAxiosMetricsBucket {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  const keys = [
    "requestCount",
    "successCount",
    "errorCount",
    "timeoutCount",
    "status4xx",
    "status5xx",
    "networkError",
  ] as const;
  return keys.every((k) => typeof o[k] === "number");
}

/** Display bundle posts in-browser axios counters; merged into GET /metrics (last report wins). */
router.post("/client", (req: Request, res: Response) => {
  const displayAxios = req.body?.displayAxios;
  if (!isOutboundAxiosBucket(displayAxios)) {
    res.status(400).json({ error: "`displayAxios` must be an object with numeric counter fields" });
    return;
  }
  setClientMetricsReport(displayAxios);
  res.sendStatus(204);
});

export default router;
