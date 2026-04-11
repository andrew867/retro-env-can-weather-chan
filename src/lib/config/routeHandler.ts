import { Request, Response } from "express";
import { initializeConfig } from "./config";
import { broadcastCrawlerUpdate, broadcastInitRefresh, registerInitSseClient } from "./initSseHub";
import { getECCCWeatherStations } from "lib/eccc/weatherStations";
import { searchLtceVirtualStations } from "lib/eccc/ltceStationSearch";
import { AuthenticRefreshConfig, GfxRuntimeConfig } from "types";

const config = initializeConfig();

export function getConfigHandler(req: Request, res: Response) {
  res.json({
    config: config.config,
    crawler: config.crawlerMessages,
    music: config.musicPlaylist ?? [],
  });
}

export function getInitHandler(req: Request, res: Response) {
  res.json({
    config: {
      font: config.lookAndFeel.font,
      provinceHighLowEnabled: config.provinceHighLowEnabled,
      configVersion: config.configVersion,
      showFooterFreshnessHint: config.lookAndFeel.showFooterFreshnessHint ?? true,
      useOfficialFonts: config.lookAndFeel.useOfficialFonts ?? true,
    },
    gfx: config.gfx,
    authenticRefresh: config.authenticRefresh,
    crawler: config.crawlerMessages,
    flavour: config.flavour,
    music: config.musicPlaylist ?? [],
    infoScreen: config.infoScreenLines ?? [],
  });
}

/** SSE: push `crawler_update` when crawler lines change (see `INIT_SSE_CRAWLER_EVENT`). */
export function getInitStreamHandler(req: Request, res: Response) {
  registerInitSseClient(res);
}

export async function postStationsHandler(req: Request, res: Response) {
  const {
    body: { search = "" },
  } = req ?? {};

  try {
    res.json({ results: await getECCCWeatherStations(search) });
  } catch (e) {
    res.status(500).json({ error: "Unable to search weather stations" });
  }
}

export async function postLtceStationsHandler(req: Request, res: Response) {
  const {
    body: { search = "" },
  } = req ?? {};

  try {
    const q = String(search ?? "").trim();
    if (q.length < 2) {
      res.status(400).json({ error: "search must be at least 2 characters" });
      return;
    }
    res.json({ results: await searchLtceVirtualStations(q) });
  } catch (e) {
    res.status(500).json({ error: "Unable to search LTCE virtual stations" });
  }
}

export function postPrimaryLocation(req: Request, res: Response) {
  const {
    body: { station },
  } = req ?? {};

  try {
    if (!station) throw "Missing `station` parameter";

    config.updateAndSaveConfigOption(() => config.setPrimaryLocation(station));
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e });
  }
}

export function postProvinceTracking(req: Request, res: Response) {
  const {
    body: { isEnabled, stations },
  } = req ?? {};

  try {
    if (!Array.isArray(stations)) throw "Invalid `stations` parameter";

    config.updateAndSaveConfigOption(() => config.setProvinceStations(isEnabled, stations));
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e });
  }
}

export function postHistoricalDataStationID(req: Request, res: Response) {
  const {
    body: { historicalDataStationID },
  } = req ?? {};

  try {
    if (isNaN(historicalDataStationID)) throw "Invalid type of `historicalDataStationID` provided";

    config.updateAndSaveConfigOption(() => config.setHistoricalDataStationID(historicalDataStationID));
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e });
  }
}

export function postClimateNormals(req: Request, res: Response) {
  const {
    body: { climateID, stationID, province },
  } = req ?? {};

  try {
    if (isNaN(climateID)) throw "Invalid type of `climateID` provided";
    if (isNaN(stationID)) throw "Invalid type of `stationID` provided";
    if (!province.length || typeof province !== "string") throw "Invalid type of `province` provided";

    config.updateAndSaveConfigOption(() => config.setClimateNormals(climateID, stationID, province));
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e });
  }
}

export function postMisc(req: Request, res: Response) {
  const {
    body: { rejectInHourConditionUpdates, alternateRecordsSource, logLevel, ltceVirtualClimateId },
  } = req ?? {};

  try {
    if (typeof rejectInHourConditionUpdates !== "boolean") throw "`rejectInHourConditionUpdates` must be true/false";
    if (typeof alternateRecordsSource !== "string") throw "`alternateRecordsSource` must be a string";
    if (logLevel !== undefined && typeof logLevel !== "string") throw "`logLevel` must be a string";
    if (ltceVirtualClimateId !== undefined && typeof ltceVirtualClimateId !== "string") {
      throw "`ltceVirtualClimateId` must be a string when provided";
    }

    config.updateAndSaveConfigOption(() =>
      config.setMiscSettings(rejectInHourConditionUpdates, alternateRecordsSource, logLevel, ltceVirtualClimateId)
    );
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e });
  }
}

export function postLookAndFeel(req: Request, res: Response) {
  const {
    body: { flavour, showFooterFreshnessHint, useOfficialFonts },
  } = req ?? {};

  try {
    if (flavour !== undefined && typeof flavour !== "string") throw "`flavour` must be a string";
    if (flavour && !config.flavours.includes(flavour)) throw "Provided `flavour` doesn't exist";
    if (showFooterFreshnessHint !== undefined && typeof showFooterFreshnessHint !== "boolean") {
      throw "`showFooterFreshnessHint` must be a boolean";
    }
    if (useOfficialFonts !== undefined && typeof useOfficialFonts !== "boolean") {
      throw "`useOfficialFonts` must be a boolean";
    }

    const patch: Partial<{
      flavour: string;
      showFooterFreshnessHint: boolean;
      useOfficialFonts: boolean;
    }> = {};
    if (flavour !== undefined) patch.flavour = flavour;
    if (showFooterFreshnessHint !== undefined) patch.showFooterFreshnessHint = showFooterFreshnessHint;
    if (useOfficialFonts !== undefined) patch.useOfficialFonts = useOfficialFonts;

    if (Object.keys(patch).length === 0) throw "No valid fields to update";

    config.updateAndSaveConfigOption(() => config.setLookAndFeelSettings(patch));
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e });
  }
}

export function postCrawlerMessages(req: Request, res: Response) {
  const {
    body: { crawler },
  } = req ?? {};

  try {
    if (!Array.isArray(crawler)) throw "`crawler` must be an array of strings";

    config.setCrawlerMessages(crawler);
    broadcastCrawlerUpdate(crawler);
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e });
  }
}

export function postAirQualityStation(req: Request, res: Response) {
  const {
    body: { station },
  } = req ?? {};

  try {
    if (typeof station === "undefined") throw "Missing `station` parameter";

    config.updateAndSaveConfigOption(() => config.setAirQualityStation(station));
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e });
  }
}

export async function postPlaylist(req: Request, res: Response) {
  try {
    await config.regeneratePlaylist();
    res.send(config.musicPlaylist);
  } catch (e) {
    res.status(500).json({ error: e });
  }
}

export function postGfx(req: Request, res: Response) {
  const body = req.body as GfxRuntimeConfig & { authenticRefresh?: AuthenticRefreshConfig };
  try {
    if (!body || typeof body !== "object") throw new Error("Invalid gfx body");
    const { authenticRefresh, ...gfxPatch } = body;
    config.updateAndSaveConfigOption(() => {
      config.setGfx(gfxPatch);
      if (authenticRefresh && typeof authenticRefresh === "object") {
        config.setAuthenticRefresh(authenticRefresh);
      }
    });
    broadcastInitRefresh();
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
