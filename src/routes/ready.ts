import express, { Request, Response } from "express";
import { getHealthPayload, getReadinessPayload } from "lib/health/readiness";

const router = express.Router();

/** Readiness for orchestration: 503 when citypage data is older than the stale threshold (see `RWC_CITYPAGE_STALE_FALLBACK_AFTER_MS`). */
router.get("/", (_req: Request, res: Response) => {
  const { ready, reason } = getReadinessPayload();
  const h = getHealthPayload();
  res.status(ready ? 200 : 503).json({
    ready,
    reason,
    service: h.service,
    uptimeSec: h.uptimeSec,
    mscAmqp: h.mscAmqp,
    degraded: h.degraded,
  });
});

export default router;
