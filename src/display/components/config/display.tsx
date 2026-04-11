import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Switch,
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
import { useSaveConfigOption } from "hooks";
import { FormEvent, useEffect, useState } from "react";
import type { FlavourNames, LtceVirtualStationSearchHit, LookAndFeel, MiscConfig } from "types";

type DisplayConfigProps = {
  flavour: string;
  flavours: FlavourNames;
  showFooterFreshnessHint: boolean;
  useOfficialFonts: boolean;
  rejectInHourConditionUpdates: boolean;
  alternateRecordsSource: string;
  /** MSC LTCE virtual climate id (e.g. VSMB38V for Winnipeg Area); empty disables LTCE backfill. */
  ltceVirtualClimateId: string;
  playlist: string[];
};

type MiscConfigOptionResponse = MiscConfig;

const exampleRecordsJSON = `{"records": [{"hi": {"value": 4.4,"year": 1880},"lo": {"value": -43.3,"year": 1885}},...]}`;

export function DisplayConfig({
  flavour,
  flavours,
  showFooterFreshnessHint,
  useOfficialFonts,
  rejectInHourConditionUpdates,
  alternateRecordsSource,
  ltceVirtualClimateId,
  playlist,
}: DisplayConfigProps) {
  const toast = useToast();
  const [mutableRejectInHourConditionUpdates, setMutableRejectInHourConditionUpdates] =
    useState(rejectInHourConditionUpdates);
  const [mutableAlternateRecordsSource, setMutableAlternateRecordsSource] = useState(alternateRecordsSource ?? "");
  const [mutableLtceVirtualClimateId, setMutableLtceVirtualClimateId] = useState(ltceVirtualClimateId ?? "");
  const [ltceNameSearch, setLtceNameSearch] = useState("");
  const [isLtceSearching, setIsLtceSearching] = useState(false);
  const [ltceSearchResults, setLtceSearchResults] = useState<LtceVirtualStationSearchHit[] | undefined>(undefined);
  const [mutableFlavour, setMutableFlavour] = useState(flavour ?? "");
  const [mutableShowFooterFreshnessHint, setMutableShowFooterFreshnessHint] = useState(showFooterFreshnessHint);
  const [mutableUseOfficialFonts, setMutableUseOfficialFonts] = useState(useOfficialFonts);
  const [mutablePlaylist, setMutablePlaylist] = useState(playlist);

  const miscSaveConfigOption = useSaveConfigOption<MiscConfigOptionResponse>("misc");
  const lookAndFeelSaveConfigOption = useSaveConfigOption<LookAndFeel>("lookAndFeel");
  const regeneratePlaylist = useSaveConfigOption<string[]>("playlist");

  const runLtceStationSearch = () => {
    const q = ltceNameSearch.trim();
    if (isLtceSearching || q.length < 2) return;
    setIsLtceSearching(true);
    axios
      .post<{ results: LtceVirtualStationSearchHit[] }>("config/ltce-stations", { search: q })
      .then((resp) => setLtceSearchResults(resp.data?.results ?? []))
      .catch(() => {
        setLtceSearchResults(undefined);
        toast({ title: "LTCE search failed", status: "error", description: "Try again or enter a virtual id manually." });
      })
      .finally(() => setIsLtceSearching(false));
  };

  const onSubmitMiscSettings = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await miscSaveConfigOption.saveConfigOption({
      rejectInHourConditionUpdates: mutableRejectInHourConditionUpdates,
      alternateRecordsSource: mutableAlternateRecordsSource,
      ltceVirtualClimateId: mutableLtceVirtualClimateId,
    });

    if (miscSaveConfigOption.wasError)
      return toast({
        title: "Unable to save misc settings",
        description: "An error occured saving your misc settings - please try again",
        status: "error",
      });

    if (miscSaveConfigOption.wasSuccess)
      return toast({
        title: "Save successful",
        description: "Your misc settings were saved",
        status: "success",
      });
  };

  const onSubmitLookAndFeelSettings = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await lookAndFeelSaveConfigOption.saveConfigOption({
      flavour: mutableFlavour,
      showFooterFreshnessHint: mutableShowFooterFreshnessHint,
      useOfficialFonts: mutableUseOfficialFonts,
    });

    if (lookAndFeelSaveConfigOption.wasError)
      return toast({
        title: "Unable to save look and feel settings",
        description: "An error occured saving your look and feel settings - please try again",
        status: "error",
      });

    if (lookAndFeelSaveConfigOption.wasSuccess)
      return toast({
        title: "Save successful",
        description: "Your look and feel settings were saved",
        status: "success",
      });
  };

  useEffect(() => {
    setMutableShowFooterFreshnessHint(showFooterFreshnessHint);
    setMutableUseOfficialFonts(useOfficialFonts);
  }, [showFooterFreshnessHint, useOfficialFonts]);

  useEffect(() => {
    setMutableLtceVirtualClimateId(ltceVirtualClimateId ?? "");
  }, [ltceVirtualClimateId]);

  useEffect(() => {
    setMutableFlavour(flavour ?? "");
  }, [flavour]);

  useEffect(() => {
    if (regeneratePlaylist.wasError)
      toast({
        title: "Unable to regenerate playlist",
        description: "An error occured regenerating your playlist - please try again",
        status: "error",
      });

    if (regeneratePlaylist.wasSuccess) {
      setMutablePlaylist(regeneratePlaylist.response);

      toast({
        title: "Playlist regenerated successful",
        description: "Your playlist was regenerated",
        status: "success",
      });
    }
  }, [regeneratePlaylist.response, regeneratePlaylist.wasError, regeneratePlaylist.wasSuccess]);

  const onSubmitRegeneratePlaylist = () => {
    regeneratePlaylist.saveConfigOption({});
  };

  return (
    <Stack spacing={6}>
      <Stack>
        <Text>General settings for the channel related to what you see on the display portion of the simulator.</Text>
      </Stack>

      <Heading size={"md"}>Misc. Settings</Heading>

      <Stack mb={6}>
        <form onSubmit={onSubmitMiscSettings}>
          <Stack>
            <FormControl>
              <FormLabel htmlFor="isEnabled">Only update weather station conditions once an hour?</FormLabel>
              <Switch
                isDisabled={miscSaveConfigOption.isSaving}
                id="isEnabled"
                isChecked={mutableRejectInHourConditionUpdates}
                onChange={() => setMutableRejectInHourConditionUpdates(!mutableRejectInHourConditionUpdates)}
              />
              <FormHelperText>
                ECCC may send multiple updates during each hour. The original channel only received one update at the
                start of the hour. Enabling this gives a more authentic feeling to the channel
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="recordsSource">Use alternative record source?</FormLabel>
              <Input
                type="url"
                value={mutableAlternateRecordsSource}
                onChange={(e) => setMutableAlternateRecordsSource(e.target.value)}
              />
              <FormHelperText>
                At times the temperature records that ECCC hold may vary with how far back they start and end - this
                allows you to create your own source of truth for temperature records. Please provide a valid URL
                pointing to a JSON of the following format:
                <pre>{exampleRecordsJSON}</pre>
                Each entry would be the day number for the year (1-366). Make sure Feb 29th is included to account for
                leap years.
              </FormHelperText>
            </FormControl>

            <Stack id="ltce_virtual_station_search" spacing={3} mt={4}>
              <Heading as="h3" size="sm">
                Search LTCE virtual stations
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Same pattern as <b>Weather Station</b>: type part of the English area name (e.g. <code>Winnipeg</code>),
                then pick a row to fill the virtual climate id below.
              </Text>
              <FormControl>
                <FormLabel htmlFor="ltceStationNameSearch">Area name</FormLabel>
                <Input
                  id="ltceStationNameSearch"
                  value={ltceNameSearch}
                  onChange={(e) => setLtceNameSearch(e.target.value)}
                  placeholder="e.g. Winnipeg, Toronto"
                />
              </FormControl>
              <Button
                type="button"
                colorScheme="teal"
                variant="outline"
                isLoading={isLtceSearching}
                isDisabled={ltceNameSearch.trim().length < 2}
                onClick={runLtceStationSearch}
              >
                Search LTCE
              </Button>

              {ltceSearchResults !== undefined && (
                <TableContainer>
                  <Table variant="striped" size="sm" aria-label="LTCE virtual station search results">
                    <Thead>
                      <Tr>
                        <Th>Virtual ID</Th>
                        <Th>Area (EN)</Th>
                        <Th>WXO</Th>
                        <Th>Prov</Th>
                        <Th />
                      </Tr>
                    </Thead>
                    <Tbody>
                      {ltceSearchResults.length ? (
                        ltceSearchResults.map((row) => (
                          <Tr key={row.virtualClimateId}>
                            <Td>{row.virtualClimateId}</Td>
                            <Td>{row.virtualStationNameEn}</Td>
                            <Td>{row.wxoCityCode}</Td>
                            <Td>{row.provinceCode}</Td>
                            <Td>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  setMutableLtceVirtualClimateId(row.virtualClimateId);
                                  toast({
                                    title: "LTCE id applied",
                                    description: `${row.virtualClimateId} — ${row.virtualStationNameEn}`,
                                    status: "success",
                                    duration: 2500,
                                  });
                                }}
                              >
                                Use
                              </Button>
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={5}>No LTCE virtual stations matched</Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </Stack>

            <FormControl mt={4}>
              <FormLabel htmlFor="ltceVirtualClimateId">LTCE virtual climate ID (almanac record high/low)</FormLabel>
              <Input
                id="ltceVirtualClimateId"
                value={mutableLtceVirtualClimateId}
                onChange={(e) => setMutableLtceVirtualClimateId(e.target.value)}
                placeholder="e.g. VSMB38V for Winnipeg Area"
              />
              <FormHelperText>
                MSC removed the citypage <code>&lt;almanac&gt;</code> block in 2024. When set, the server loads daily
                record temperatures from{" "}
                <a href="https://api.weather.gc.ca/collections/ltce-temperature" target="_blank" rel="noreferrer">
                  LTCE — Temperature
                </a>{" "}
                (virtual station list:{" "}
                <a href="https://api.weather.gc.ca/collections/ltce-stations/items?f=csv" target="_blank" rel="noreferrer">
                  ltce-stations CSV
                </a>
                ). Leave empty to disable. Operator doc: <code>docs/specs/SPEC-ltce-almanac-records.md</code>.
              </FormHelperText>
            </FormControl>
          </Stack>

          <Button type="submit" mt={4} colorScheme="teal" isLoading={miscSaveConfigOption.isSaving}>
            Save
          </Button>
        </form>
      </Stack>

      <Heading size={"md"}>Look and Feel</Heading>

      <Stack>
        <form onSubmit={onSubmitLookAndFeelSettings}>
          <FormControl>
            <FormLabel htmlFor="selectFlavour">Flavour</FormLabel>
            <Select
              onChange={(e) => setMutableFlavour(e.target.value)}
              maxWidth={"md"}
              value={mutableFlavour}
              id="selectFlavour"
            >
              <option value={""}>Default</option>
              {flavours.map((flavourName) => (
                <option key={flavourName} value={flavourName}>
                  {flavourName}
                </option>
              ))}
            </Select>
            <FormHelperText>See the "Flavours" tab for more info about flavours</FormHelperText>
          </FormControl>

          <FormControl mt={4}>
            <FormLabel htmlFor="footerFreshnessHint">Show footer “snapshot may be outdated” line</FormLabel>
            <Switch
              isDisabled={lookAndFeelSaveConfigOption.isSaving}
              id="footerFreshnessHint"
              isChecked={mutableShowFooterFreshnessHint}
              onChange={() => setMutableShowFooterFreshnessHint(!mutableShowFooterFreshnessHint)}
            />
            <FormHelperText>
              When off, the bottom freshness hint is hidden even if polled data is stale.
            </FormHelperText>
          </FormControl>

          <FormControl mt={4}>
            <FormLabel htmlFor="officialFonts">ECWC / GWCV official fonts</FormLabel>
            <Switch
              isDisabled={lookAndFeelSaveConfigOption.isSaving}
              id="officialFonts"
              isChecked={mutableUseOfficialFonts}
              onChange={() => setMutableUseOfficialFonts(!mutableUseOfficialFonts)}
            />
            <FormHelperText>
              On (default): recw/GWCV webfonts. Off: legacy consolas + ws4000 crawler — useful when comparing with older
              builds or tracking upstream typography changes.
            </FormHelperText>
          </FormControl>

          <Button type="submit" mt={4} colorScheme="teal" isLoading={lookAndFeelSaveConfigOption.isSaving}>
            Save
          </Button>
        </form>
      </Stack>

      <Heading size={"md"}>Playlist</Heading>

      <Stack>
        <Text>
          You currently have <b>{mutablePlaylist.length} tracks</b> in rotation
        </Text>

        <Button
          type="button"
          mt={4}
          colorScheme="teal"
          isLoading={regeneratePlaylist.isSaving}
          onClick={onSubmitRegeneratePlaylist}
        >
          Regenerate Playlist
        </Button>
      </Stack>
    </Stack>
  );
}
