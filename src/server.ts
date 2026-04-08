import { initializeAPI } from "api";
import "lib/serverStartedAt";
import { validateDirectories } from "lib";
import { warnIfLowDiskFreeMib } from "lib/storage";
import { initializeConfig } from "lib/config";
import {
  initializeAirQuality,
  initializeCanadaProvincialHotColdSpot,
  initializeClimateNormals,
  initializeCurrentConditions,
  initializeHistoricalTempPrecip,
} from "lib/eccc";
import { initializeAlertMonitor } from "lib/eccc/alertMonitor";
import Logger from "lib/logger";
import { initializeNationalWeather } from "lib/national";
import { initializeProvinceTracking } from "lib/provincetracking";
import { initializeSunspots } from "lib/sunspots";
import { initializeAirportMetarWeather } from "lib/airportMetar";
import { initializeUSAWeather } from "lib/usaweather";

const logger = new Logger("Server");

logger.log("Starting RWC...");
validateDirectories();
warnIfLowDiskFreeMib();
initializeConfig();
initializeCurrentConditions();
initializeHistoricalTempPrecip().fetchLastTwoYearsOfData(new Date());
initializeClimateNormals().fetchClimateNormals(new Date());
initializeAlertMonitor();
initializeAirQuality();
initializeNationalWeather();
initializeProvinceTracking();
initializeCanadaProvincialHotColdSpot();
initializeUSAWeather();
initializeAirportMetarWeather();
initializeSunspots();
initializeAPI();
logger.log("Started RWC");
