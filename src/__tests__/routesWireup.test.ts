import express, { type Router } from "express";
import airQualityRoutes from "routes/airQuality";
import configRoutes from "routes/config";
import flavourRoutes from "routes/flavour";
import healthRoutes from "routes/health";
import initRoutes from "routes/init";
import metricsRoutes from "routes/metrics";
import readyRoutes from "routes/ready";
import seasonRoutes from "routes/season";
import statusRoutes from "routes/status";
import weatherRoutes from "routes/weather";
import { initializeRouter } from "routes/index";

describe("route modules wire-up", () => {
  it("exports Express routers (default) for every route file", () => {
    const routers = [
      initRoutes,
      healthRoutes,
      readyRoutes,
      metricsRoutes,
      statusRoutes,
      weatherRoutes,
      configRoutes,
      seasonRoutes,
      flavourRoutes,
      airQualityRoutes,
    ];
    for (const r of routers) {
      expect(typeof r).toBe("function");
      expect(Array.isArray((r as Router).stack)).toBe(true);
    }
  });

  it("initializeRouter mounts without Express Route.post undefined handler errors", () => {
    const app = express();
    expect(() => {
      app.use("/api/v1", initializeRouter());
    }).not.toThrow();
  });
});
