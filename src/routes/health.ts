import express, { Request, Response } from "express";
import { getHealthPayload } from "lib/health/readiness";

const router = express.Router();

router.get("/", (_req: Request, res: Response) => {
  res.json(getHealthPayload());
});

export default router;
