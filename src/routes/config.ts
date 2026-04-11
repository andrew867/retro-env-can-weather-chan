import express, { Request, Response } from "express";
import {
  getConfigHandler,
  postPrimaryLocation,
  postLocationQuickSetup,
  postLocationFeedSuggestions,
  postStationsHandler,
  postLtceStationsHandler,
  postProvinceTracking,
  postHistoricalDataStationID,
  postClimateNormals,
  postMisc,
  postLookAndFeel,
  postCrawlerMessages,
  postAirQualityStation,
  postAirportMetarStations,
  postPlaylist,
  postGfx,
} from "lib/config";

/*
 * "/" here represents "/config"
 */

const router = express.Router();
router.get("/", getConfigHandler);
router.post("/stations", async (req: Request, res: Response) => await postStationsHandler(req, res));
router.post("/ltce-stations", async (req: Request, res: Response) => await postLtceStationsHandler(req, res));
router.post("/primaryLocation", postPrimaryLocation);
router.post("/locationQuickSetup", async (req: Request, res: Response) => await postLocationQuickSetup(req, res));
router.post("/locationFeedSuggestions", async (req: Request, res: Response) => await postLocationFeedSuggestions(req, res));
router.post("/airportMetarStations", postAirportMetarStations);
router.post("/provinceTracking", postProvinceTracking);
router.post("/historicalDataStationID", postHistoricalDataStationID);
router.post("/climateNormals", postClimateNormals);
router.post("/misc", postMisc);
router.post("/lookAndFeel", postLookAndFeel);
router.post("/airQuality", postAirQualityStation);
router.post("/crawler", postCrawlerMessages);
router.post("/playlist", async (req: Request, res: Response) => await postPlaylist(req, res));
router.post("/gfx", postGfx);

export default router;
