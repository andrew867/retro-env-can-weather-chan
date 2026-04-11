import {
  Button,
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
import { MAX_AIRPORT_METAR_STATIONS } from "consts";
import type { AirportMetarStation } from "types";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

type AirportMetarConfigProps = {
  stations: AirportMetarStation[];
  onSaved: () => void;
};

export function AirportMetarConfig({ stations, onSaved }: AirportMetarConfigProps) {
  const toast = useToast();
  const [rows, setRows] = useState<AirportMetarStation[]>(() => [...stations]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows([...stations]);
  }, [stations]);

  const updateRow = (i: number, patch: Partial<AirportMetarStation>) => {
    setRows((prev) => prev.map((r, ix) => (ix === i ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    if (rows.length >= MAX_AIRPORT_METAR_STATIONS) return;
    setRows((prev) => [...prev, { name: "", code: "" }]);
  };

  const removeRow = (i: number) => {
    setRows((prev) => prev.filter((_, ix) => ix !== i));
  };

  const save = () => {
    setSaving(true);
    axios
      .post("config/airportMetarStations", { stations: rows })
      .then(() => {
        toast({ title: "Airport METAR list saved", status: "success" });
        onSaved();
      })
      .catch(() => toast({ title: "Save failed", status: "error" }))
      .finally(() => setSaving(false));
  };

  return (
    <Stack spacing={4} id="airport_metar_config">
      <Heading as="h2" size="md">
        Airport METAR (ICAO)
      </Heading>
      <Text fontSize="sm" color="gray.600">
        Up to {MAX_AIRPORT_METAR_STATIONS} stations for the METAR rotator (NOAA AWC / NWS). Quick setup can fill this
        list from MSC SWOB near the primary citypage point; you can still edit rows here.
      </Text>
      <TableContainer>
        <Table size="sm" variant="striped">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>ICAO</Th>
              <Th w="24"> </Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((r, i) => (
              <Tr key={`${i}-${r.code}`}>
                <Td>
                  <Input
                    size="sm"
                    value={r.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateRow(i, { name: e.target.value })}
                  />
                </Td>
                <Td>
                  <Input
                    size="sm"
                    value={r.code}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateRow(i, { code: e.target.value.toUpperCase() })
                    }
                  />
                </Td>
                <Td>
                  <Button size="xs" variant="ghost" onClick={() => removeRow(i)}>
                    Remove
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Stack direction="row" spacing={3}>
        <Button size="sm" onClick={addRow} isDisabled={rows.length >= MAX_AIRPORT_METAR_STATIONS}>
          Add row
        </Button>
        <Button colorScheme="green" isLoading={saving} onClick={save}>
          Save METAR stations
        </Button>
      </Stack>
    </Stack>
  );
}
