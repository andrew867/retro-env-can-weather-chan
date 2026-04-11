import { useChannelCurrentConfig } from "hooks";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, Text } from "@chakra-ui/react";
import { CrawlerConfig, DisplayConfig, FlavoursConfig, GfxConfig, LocationsHubConfig } from "display/components/config";

const ConfigScreen = () => {
  const { config, fetched, refetch } = useChannelCurrentConfig();
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
              <Tab>Locations &amp; feeds</Tab>
              <Tab>Display</Tab>
              <Tab>Graphics</Tab>
              <Tab>Flavours</Tab>
              <Tab>Crawler</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <LocationsHubConfig
                  primaryLocation={config.primaryLocation}
                  provinceHighLowEnabled={config.provinceHighLowEnabled ?? true}
                  provinceStations={config.provinceStations ?? []}
                  historicalDataStationID={config.historicalDataStationID ?? 27174}
                  climateNormals={
                    config.climateNormals ?? {
                      stationID: 3698,
                      climateID: 5023222,
                      province: config.primaryLocation?.province ?? "MB",
                    }
                  }
                  airQualityStation={config.airQualityStation ?? ""}
                  rejectInHourConditionUpdates={config.misc?.rejectInHourConditionUpdates ?? false}
                  alternateRecordsSource={config.misc?.alternateRecordsSource ?? ""}
                  logLevel={config.misc?.logLevel ?? "warn"}
                  ltceVirtualClimateId={config.misc?.ltceVirtualClimateId ?? ""}
                  onQuickSetupDone={() => refetch()}
                />
              </TabPanel>
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
