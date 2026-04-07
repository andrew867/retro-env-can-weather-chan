import express, { NextFunction, Request, Response } from "express";
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

export default router;
