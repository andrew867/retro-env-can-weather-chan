import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import axios from "lib/axios";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import type { ClimateNormals, ECCCWeatherStation, PrimaryLocation, ProvinceStation } from "types";
import { AirQualityConfig } from "./airQuality";
import { ClimateNormalsConfig } from "./climateNormals";
import { HistoricalDataStationIDConfig } from "./historicalDataStationID";
import { LtceBackfillSection } from "./ltceBackfillSection";
import { ProvinceTempPrecipConfig } from "./provinceTempPrecip";
import { WeatherStationConfig } from "./weatherstation";

type LocationsHubConfigProps = {
  primaryLocation: PrimaryLocation;
  provinceHighLowEnabled: boolean;
  provinceStations: ProvinceStation[];
  historicalDataStationID: number;
  climateNormals: ClimateNormals;
  airQualityStation: string;
  rejectInHourConditionUpdates: boolean;
  alternateRecordsSource: string;
  logLevel: string;
  ltceVirtualClimateId: string;
  onQuickSetupDone: () => void;
};

export function LocationsHubConfig({
  primaryLocation,
  provinceHighLowEnabled,
  provinceStations,
  historicalDataStationID,
  climateNormals,
  airQualityStation,
  rejectInHourConditionUpdates,
  alternateRecordsSource,
  logLevel,
  ltceVirtualClimateId,
  onQuickSetupDone,
}: LocationsHubConfigProps) {
  const toast = useToast();
  const [quickSearch, setQuickSearch] = useState("");
  const [quickSearching, setQuickSearching] = useState(false);
  const [quickResults, setQuickResults] = useState<ECCCWeatherStation[] | undefined>(undefined);
  const [quickSelected, setQuickSelected] = useState<ECCCWeatherStation | null>(null);
  const [applyProvincePreset, setApplyProvincePreset] = useState(true);
  const [quickApplying, setQuickApplying] = useState(false);

  const onQuickSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (quickSearching || !quickSearch?.trim() || quickSearch.trim().length < 3) return;
    setQuickSearching(true);
    axios
      .post<{ results: ECCCWeatherStation[] }>("config/stations", { search: quickSearch.trim() })
      .then((resp) => setQuickResults(resp.data?.results ?? []))
      .catch(() => setQuickResults(undefined))
      .finally(() => setQuickSearching(false));
  };

  const applyQuickSetup = () => {
    if (!quickSelected) {
      toast({ title: "Pick a station", description: "Search and choose a row first.", status: "warning" });
      return;
    }
    setQuickApplying(true);
    axios
      .post("config/locationQuickSetup", {
        station: quickSelected,
        applyProvincePreset,
      })
      .then(() => {
        toast({
          title: "Quick setup applied",
          description: "Primary MSC bundle saved. Province preset applied when available for this province.",
          status: "success",
        });
        onQuickSetupDone();
      })
      .catch(() => {
        toast({ title: "Quick setup failed", status: "error", description: "Check API logs and try again." });
      })
      .finally(() => setQuickApplying(false));
  };

  return (
    <Stack spacing={10}>
      <Stack spacing={4} id="location_quick_setup">
        <Heading as="h2" size="md">
          Quick setup (primary + MSC bundle)
        </Heading>
        <Text fontSize="sm" color="gray.600">
          Search MSC citypage sites, pick one row, then apply. This sets the primary location (with curated
          historical / normals / LTCE ids when we have them) and optionally replaces the province grid with a verified
          preset for <b>ON</b> or <b>MB</b> only.
        </Text>
        <form onSubmit={onQuickSearch}>
          <Stack direction={{ base: "column", md: "row" }} spacing={4} align="flex-end">
            <FormControl>
              <FormLabel>City / town search</FormLabel>
              <Input value={quickSearch} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuickSearch(e.target.value)} />
            </FormControl>
            <Button type="submit" colorScheme="teal" isLoading={quickSearching} isDisabled={!quickSearch || quickSearch.length < 3}>
              Search
            </Button>
          </Stack>
        </form>

        {quickResults && (
          <TableContainer>
            <Table size="sm" variant="striped">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Province</Th>
                  <Th>Code</Th>
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {quickResults.length ? (
                  quickResults.map((r) => (
                    <Tr key={r.location}>
                      <Td>{r.name}</Td>
                      <Td>{r.province}</Td>
                      <Td>{r.location}</Td>
                      <Td>
                        <Button size="sm" variant={quickSelected?.location === r.location ? "solid" : "outline"} onClick={() => setQuickSelected(r)}>
                          Use for quick setup
                        </Button>
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={4}>No stations found</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        )}

        <Checkbox isChecked={applyProvincePreset} onChange={(e) => setApplyProvincePreset(e.target.checked)}>
          Apply ON / MB province tracking preset when available
        </Checkbox>
        <Button colorScheme="green" isLoading={quickApplying} isDisabled={!quickSelected} onClick={applyQuickSetup}>
          Apply quick setup
        </Button>
      </Stack>

      <Stack spacing={4}>
        <Heading as="h2" size="md">
          Primary weather station
        </Heading>
        <WeatherStationConfig weatherStation={primaryLocation} />
      </Stack>

      <Stack spacing={4}>
        <Heading as="h2" size="md">
          Province temp / precip grid
        </Heading>
        <ProvinceTempPrecipConfig isEnabled={provinceHighLowEnabled ?? true} stations={provinceStations ?? []} />
      </Stack>

      <Stack spacing={4}>
        <Heading as="h2" size="md">
          Historical data station (bulk)
        </Heading>
        <HistoricalDataStationIDConfig historicalDataStationID={historicalDataStationID} />
      </Stack>

      <Stack spacing={4}>
        <Heading as="h2" size="md">
          Climate normals
        </Heading>
        <ClimateNormalsConfig climateNormals={climateNormals} />
      </Stack>

      <Stack spacing={4}>
        <Heading as="h2" size="md">
          Air quality (AQHI)
        </Heading>
        <AirQualityConfig station={airQualityStation} />
      </Stack>

      <LtceBackfillSection
        rejectInHourConditionUpdates={rejectInHourConditionUpdates}
        alternateRecordsSource={alternateRecordsSource}
        logLevel={logLevel}
        ltceVirtualClimateId={ltceVirtualClimateId}
      />
    </Stack>
  );
}
