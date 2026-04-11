import {
  Button,
  FormControl,
  FormHelperText,
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
import { type FormEvent, useEffect, useState } from "react";
import type { LtceVirtualStationSearchHit } from "types";

type LtceBackfillSectionProps = {
  rejectInHourConditionUpdates: boolean;
  alternateRecordsSource: string;
  logLevel: string;
  ltceVirtualClimateId: string;
};

export function LtceBackfillSection({
  rejectInHourConditionUpdates,
  alternateRecordsSource,
  logLevel,
  ltceVirtualClimateId,
}: LtceBackfillSectionProps) {
  const toast = useToast();
  const [ltceSaving, setLtceSaving] = useState(false);
  const [ltceNameSearch, setLtceNameSearch] = useState("");
  const [isLtceSearching, setIsLtceSearching] = useState(false);
  const [ltceSearchResults, setLtceSearchResults] = useState<LtceVirtualStationSearchHit[] | undefined>(undefined);
  const [mutableLtceVirtualClimateId, setMutableLtceVirtualClimateId] = useState(ltceVirtualClimateId ?? "");

  useEffect(() => {
    setMutableLtceVirtualClimateId(ltceVirtualClimateId ?? "");
  }, [ltceVirtualClimateId]);

  const runLtceStationSearch = () => {
    const q = ltceNameSearch.trim();
    if (isLtceSearching || q.length < 2) return;
    setIsLtceSearching(true);
    axios
      .post<{ results: LtceVirtualStationSearchHit[] }>("config/ltce-stations", { search: q })
      .then((resp) => setLtceSearchResults(resp.data?.results ?? []))
      .catch(() => {
        setLtceSearchResults(undefined);
        toast({
          title: "LTCE search failed",
          status: "error",
          description: "Try again or enter a virtual id manually.",
        });
      })
      .finally(() => setIsLtceSearching(false));
  };

  const onSubmitLtceMisc = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLtceSaving(true);
    axios
      .post("config/misc", {
        rejectInHourConditionUpdates,
        alternateRecordsSource,
        logLevel,
        ltceVirtualClimateId: mutableLtceVirtualClimateId,
      })
      .then(() => toast({ title: "Save successful", description: "LTCE virtual id saved", status: "success" }))
      .catch(() =>
        toast({
          title: "Unable to save LTCE settings",
          description: "An error occurred saving misc / LTCE — try again.",
          status: "error",
        })
      )
      .finally(() => setLtceSaving(false));
  };

  return (
    <Stack spacing={4}>
      <Heading as="h2" size="md">
        LTCE almanac record high / low (MSC)
      </Heading>
      <Text fontSize="sm" color="gray.600">
        Citypage often omits <code>&lt;almanac&gt;</code> extremes. Set a virtual climate id from MSC LTCE, or leave
        empty to disable backfill.
      </Text>

      <form onSubmit={onSubmitLtceMisc}>
        <Stack id="ltce_virtual_station_search" spacing={3}>
          <Heading as="h3" size="sm">
            Search LTCE virtual stations
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Type part of the English area name (e.g. <code>Winnipeg</code>), then pick a row to fill the virtual
            climate id below.
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

          <FormControl mt={4}>
            <FormLabel htmlFor="ltceVirtualClimateId">LTCE virtual climate ID</FormLabel>
            <Input
              id="ltceVirtualClimateId"
              value={mutableLtceVirtualClimateId}
              onChange={(e) => setMutableLtceVirtualClimateId(e.target.value)}
              placeholder="e.g. VSMB38V for Winnipeg Area"
            />
            <FormHelperText>
              Leave empty to disable. Operator reference: <code>docs/specs/SPEC-ltce-almanac-records.md</code>.
            </FormHelperText>
          </FormControl>
        </Stack>

        <Button type="submit" mt={4} colorScheme="teal" isLoading={ltceSaving}>
          Save LTCE
        </Button>
      </form>
    </Stack>
  );
}
