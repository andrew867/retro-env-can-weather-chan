import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Radio,
  RadioGroup,
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
import type {
  AirportMetarStation,
  ClimateNormals,
  ECCCWeatherStation,
  LocationFeedSuggestions,
  PrimaryLocation,
  ProvinceStation,
} from "types";
import { AirQualityConfig } from "./airQuality";
import { AirportMetarConfig } from "./airportMetarConfig";
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
  airportMetarStations: AirportMetarStation[];
  rejectInHourConditionUpdates: boolean;
  alternateRecordsSource: string;
  logLevel: string;
  ltceVirtualClimateId: string;
  onQuickSetupDone: () => void;
};

function summarizeSuggestions(s: LocationFeedSuggestions): string {
  const parts: string[] = [];
  if (s.citypageLatLon) {
    parts.push(`Citypage point: ${s.citypageLatLon.lat.toFixed(3)}°, ${s.citypageLatLon.long.toFixed(3)}°`);
  } else {
    parts.push("Citypage coordinates: not available");
  }
  if (s.climate) {
    parts.push(
      `Climate / bulk: ${s.climate.stationName} (STN ${s.climate.historicalDataStationID}, climate ${s.climate.climateNormalsClimateID}, ~${s.climate.distanceKm.toFixed(1)} km)`
    );
  } else {
    parts.push("Climate / bulk: (no automatic pick — use curated anchor or set manually)");
  }
  if (s.ltce) {
    parts.push(`LTCE virtual: ${s.ltce.virtualStationNameEn} (${s.ltce.virtualClimateId}, ~${s.ltce.distanceKm.toFixed(1)} km)`);
  } else {
    parts.push("LTCE virtual: (none resolved)");
  }
  if (s.aqhi) {
    parts.push(`AQHI: ${s.aqhi.stationKey} — ${s.aqhi.locationNameEn} (~${s.aqhi.distanceKm.toFixed(1)} km)`);
  } else {
    parts.push("AQHI: (none resolved)");
  }
  if (s.airportMetar?.length) {
    parts.push(`METAR: ${s.airportMetar.map((m) => `${m.code} (${m.name})`).join(" · ")}`);
  } else {
    parts.push("METAR: (none resolved)");
  }
  return parts.join("\n");
}

export function LocationsHubConfig({
  primaryLocation,
  provinceHighLowEnabled,
  provinceStations,
  historicalDataStationID,
  climateNormals,
  airQualityStation,
  airportMetarStations,
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
  const [applyDynamicClimate, setApplyDynamicClimate] = useState(true);
  const [applyNearestAqhi, setApplyNearestAqhi] = useState(true);
  const [applyNearestMetar, setApplyNearestMetar] = useState(true);
  const [metarHeuristic, setMetarHeuristic] = useState<"nearest" | "interesting">("interesting");
  const [quickApplying, setQuickApplying] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);

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

  const runPreview = () => {
    if (!quickSelected) {
      toast({ title: "Pick a station", description: "Search and choose a row first.", status: "warning" });
      return;
    }
    setPreviewLoading(true);
    axios
      .post<{ suggestions: LocationFeedSuggestions }>("config/locationFeedSuggestions", {
        station: quickSelected,
        flags: {
          dynamicClimateAndLtce: applyDynamicClimate,
          aqhi: applyNearestAqhi,
          metar: applyNearestMetar,
          metarHeuristic,
        },
      })
      .then((resp) => {
        const s = resp.data?.suggestions;
        if (!s) {
          setPreviewText(null);
          return;
        }
        setPreviewText(summarizeSuggestions(s));
      })
      .catch(() => {
        setPreviewText(null);
        toast({ title: "Preview failed", status: "error" });
      })
      .finally(() => setPreviewLoading(false));
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
        applyDynamicClimateWhenNoAnchor: applyDynamicClimate,
        applyNearestAqhi,
        applyNearestMetar,
        metarHeuristic,
      })
      .then(() => {
        toast({
          title: "Quick setup applied",
          description: "Primary location saved. MSC overlays applied for the options you enabled.",
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
          Quick setup (primary + MSC feeds)
        </Heading>
        <Text fontSize="sm" color="gray.600">
          Search MSC citypage sites, pick one row, then apply. Curated historical / normals / LTCE bundles still apply
          automatically when we maintain an anchor for that citypage code; otherwise MSC <b>climate-stations</b> and{" "}
          <b>ltce-stations</b> OGC collections pick the nearest viable station. Optional <b>aqhi-stations</b> and{" "}
          <b>swob-stations</b> lookups can set AQHI and the METAR rotator list from geometry near the citypage point.
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
                        <Button
                          size="sm"
                          variant={quickSelected?.location === r.location ? "solid" : "outline"}
                          onClick={() => setQuickSelected(r)}
                        >
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

        <Stack spacing={2}>
          <Text fontSize="sm" fontWeight="semibold">
            MSC OGC automation (uses live citypage + api.weather.gc.ca)
          </Text>
          <Checkbox isChecked={applyDynamicClimate} onChange={(e) => setApplyDynamicClimate(e.target.checked)}>
            When there is no curated bundle, resolve nearest hourly + normals climate station and nearest LTCE virtual
            station
          </Checkbox>
          <Checkbox isChecked={applyNearestAqhi} onChange={(e) => setApplyNearestAqhi(e.target.checked)}>
            Set AQHI from nearest MSC AQHI location
          </Checkbox>
          <Checkbox isChecked={applyNearestMetar} onChange={(e) => setApplyNearestMetar(e.target.checked)}>
            Fill METAR ICAO list from nearest Canadian SWOB airports
          </Checkbox>
          <FormControl>
            <FormLabel fontSize="sm">METAR ranking</FormLabel>
            <RadioGroup
              value={metarHeuristic}
              onChange={(v: string) => setMetarHeuristic(v === "nearest" ? "nearest" : "interesting")}
            >
              <Stack direction="row" spacing={6}>
                <Radio value="interesting">Interesting (boost major airports)</Radio>
                <Radio value="nearest">Nearest only</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        </Stack>

        <Checkbox isChecked={applyProvincePreset} onChange={(e) => setApplyProvincePreset(e.target.checked)}>
          Apply ON / MB province tracking preset when available
        </Checkbox>

        <Stack direction={{ base: "column", sm: "row" }} spacing={3}>
          <Button variant="outline" isLoading={previewLoading} isDisabled={!quickSelected} onClick={runPreview}>
            Preview MSC suggestions
          </Button>
          <Button colorScheme="green" isLoading={quickApplying} isDisabled={!quickSelected} onClick={applyQuickSetup}>
            Apply quick setup
          </Button>
        </Stack>

        {previewText && (
          <Text fontSize="sm" whiteSpace="pre-wrap" borderWidth="1px" borderRadius="md" p={3} bg="gray.50">
            {previewText}
          </Text>
        )}
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

      <AirportMetarConfig stations={airportMetarStations ?? []} onSaved={onQuickSetupDone} />

      <LtceBackfillSection
        rejectInHourConditionUpdates={rejectInHourConditionUpdates}
        alternateRecordsSource={alternateRecordsSource}
        logLevel={logLevel}
        ltceVirtualClimateId={ltceVirtualClimateId}
      />
    </Stack>
  );
}
