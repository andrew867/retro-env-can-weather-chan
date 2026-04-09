import express, { NextFunction, Request, Response } from "express";
import {
  buildStatusSnapshot,
  isStatusRefreshTarget,
  triggerStatusRefresh,
  triggerStatusRefreshAll,
} from "lib/status/buildSnapshot";
import { isStatusDashboardEnabled, statusAuthToken } from "lib/status/statusEnv";

const router = express.Router();

const token = statusAuthToken();

router.use((_req: Request, res: Response, next: NextFunction) => {
  if (!isStatusDashboardEnabled()) {
    res.status(404).json({
      error: "status_disabled",
      hint: "Set RWC_STATUS_ENABLED=1 in production, or unset NODE_ENV=production for local dev.",
    });
    return;
  }
  if (!token) return next();
  const auth = _req.headers.authorization;
  if (auth !== `Bearer ${token}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

router.get("/", (_req: Request, res: Response) => {
  res.json(buildStatusSnapshot());
});

router.post("/refresh", (req: Request, res: Response) => {
  const body = req.body ?? {};
  const scope = body.scope;

  if (scope === "all") {
    triggerStatusRefreshAll();
    res.status(202).json({ triggered: "all", targets: "all_supported_feeds" });
    return;
  }

  if (scope === "single" && typeof body.target === "string") {
    if (!isStatusRefreshTarget(body.target)) {
      res.status(400).json({ error: "unknown_target", target: body.target });
      return;
    }
    triggerStatusRefresh(body.target);
    res.status(202).json({ triggered: "single", target: body.target });
    return;
  }

  res.status(400).json({
    error: "invalid_body",
    hint: 'Use { "scope": "all" } or { "scope": "single", "target": "<feed>" }.',
  });
});

export default router;
