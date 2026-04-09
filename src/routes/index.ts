import express, { Router } from "express";
import initRoutes from "./init";
import weatherRoutes from "./weather";
import configRoutes from "./config";
import seasonRoutes from "./season";
import flavourRoutes from "./flavour";
import airQualityRoutes from "./airQuality";
import metricsRoutes from "./metrics";
import statusRoutes from "./status";
import healthRoutes from "./health";
import readyRoutes from "./ready";

export function initializeRouter(): Router {
  const router = express.Router();
  router.use("/init", initRoutes);
  router.use("/health", healthRoutes);
  router.use("/healthz", healthRoutes);
  router.use("/ready", readyRoutes);
  router.use("/metrics", metricsRoutes);
  router.use("/status", statusRoutes);
  router.use("/weather", weatherRoutes);
  router.use("/config", configRoutes);
  router.use("/season", seasonRoutes);
  router.use("/flavour", flavourRoutes);
  router.use("/airquality", airQualityRoutes);

  return router;
}
