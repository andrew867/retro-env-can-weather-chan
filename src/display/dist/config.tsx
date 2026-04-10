import { useChannelCurrentConfig } from "hooks";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, Text } from "@chakra-ui/react";
import {
  AirQualityConfig,
  ClimateNormalsConfig,
  CrawlerConfig,
  DisplayConfig,
  FlavoursConfig,
  GfxConfig,
  HistoricalDataStationIDConfig,
  ProvinceTempPrecipConfig,
  WeatherStationConfig,
} from "display/components/config";

const ConfigScreen = () => {
  const { config, fetched } = useChannelCurrentConfig();
  /** Keeps Display tab flavour dropdown in sync when Flavours tab adds/renames lists (server returns `flavours` on save). */
  const [flavoursList, setFlavoursList] = useState<string[]>([]);

  useEffect(() => {
    if (!config) return;
    setFlavoursList(config.flavours ?? []);
  }, [config]);

  return (
    <>
      <Heading>Weather Simulator Config</Heading>
      {!fetched && <>Fetching config...</>}
      {fetched && !config && (
        <Text mt={4} color="red.500">
          Could not load configuration from the API. Check that the simulator is running and try refreshing this page.
        </Text>
      )}
      {fetched && config && (
        <>
          <Tabs>
            <TabList>
              <Tab>Display</Tab>
              <Tab>Graphics</Tab>
              <Tab>Weather Station</Tab>
              <Tab>Province Temp/Precip</Tab>
              <Tab>Historical Data</Tab>
              <Tab>Climate Normals</Tab>
              <Tab>Air Quality</Tab>
              <Tab>Flavours</Tab>
              <Tab>Crawler</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <DisplayConfig
                  alternateRecordsSource={config.misc?.alternateRecordsSource ?? ""}
                  rejectInHourConditionUpdates={config.misc?.rejectInHourConditionUpdates ?? false}
                  flavour={config.lookAndFeel?.flavour ?? ""}
                  showFooterFreshnessHint={config.lookAndFeel?.showFooterFreshnessHint ?? true}
                  useOfficialFonts={config.lookAndFeel?.useOfficialFonts ?? true}
                  flavours={flavoursList}
                  playlist={config.music ?? []}
                />
              </TabPanel>
              <TabPanel>
                <GfxConfig
                  gfx={config.gfx ?? {}}
                  authenticRefresh={config.authenticRefresh}
                  useOfficialFonts={config.lookAndFeel?.useOfficialFonts ?? true}
                />
              </TabPanel>
              <TabPanel>
                <WeatherStationConfig weatherStation={config.primaryLocation} />
              </TabPanel>
              <TabPanel>
                <ProvinceTempPrecipConfig
                  isEnabled={config.provinceHighLowEnabled ?? true}
                  stations={config.provinceStations ?? []}
                />
              </TabPanel>
              <TabPanel>
                <HistoricalDataStationIDConfig historicalDataStationID={config.historicalDataStationID} />
              </TabPanel>

              <TabPanel>
                <ClimateNormalsConfig climateNormals={config.climateNormals} />
              </TabPanel>

              <TabPanel>
                <AirQualityConfig station={config.airQualityStation} />
              </TabPanel>

              <TabPanel>
                <FlavoursConfig currentFlavours={flavoursList} onFlavoursListChange={setFlavoursList} />
              </TabPanel>

              <TabPanel>
                <CrawlerConfig crawler={config.crawler ?? []} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </>
      )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("config") as HTMLElement);
root &&
  root.render(
    <React.StrictMode>
      <ChakraProvider>
        <ConfigScreen />
      </ChakraProvider>
    </React.StrictMode>
  );
