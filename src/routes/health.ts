import express, { Request, Response } from "express";
import { SERVER_STARTED_AT_MS } from "lib/serverStartedAt";

const router = express.Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "rwc",
    uptimeSec: Math.floor((Date.now() - SERVER_STARTED_AT_MS) / 1000),
  });
});

export default router;
