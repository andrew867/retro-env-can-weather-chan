import axios from "lib/axios";
import React, { Fragment, useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Box,
  Button,
  ChakraProvider,
  Collapse,
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
} from "@chakra-ui/react";

const BEARER_KEY = "rwcStatusBearer";

type FeedSource = "live" | "lkg" | "none";

type FeedBlock = {
  dataFetchedAt: string | null;
  servedDataAsOf: string | null;
  source: FeedSource;
  note?: string;
  observationId?: string | null;
  count?: number;
};

type StatusPayload = {
  statusSchemaVersion: number;
  server: { uptimeSec: number; packageVersion: string; nodeEnv: string };
  feeds: Record<string, FeedBlock>;
};

type PayloadPart = { label: string; path: string };

type RowDef = { label: string; feedKey: string; refreshTarget: string; payloadParts: PayloadPart[] };

const ROWS: RowDef[] = [
  {
    label: "Citypage (observed / forecast / almanac)",
    feedKey: "citypage",
    refreshTarget: "observed",
    payloadParts: [
      { label: "GET weather/observed", path: "weather/observed" },
      { label: "GET weather/forecast", path: "weather/forecast" },
      { label: "GET weather/almanac", path: "weather/almanac" },
    ],
  },
  {
    label: "National stations",
    feedKey: "national",
    refreshTarget: "national",
    payloadParts: [{ label: "GET weather/national", path: "weather/national" }],
  },
  {
    label: "USA stations",
    feedKey: "usa",
    refreshTarget: "usa",
    payloadParts: [{ label: "GET weather/usa", path: "weather/usa" }],
  },
  {
    label: "Airport METAR",
    feedKey: "airport_metar",
    refreshTarget: "airport_metar",
    payloadParts: [{ label: "GET weather/airport-metar", path: "weather/airport-metar" }],
  },
  {
    label: "Province tracking",
    feedKey: "province",
    refreshTarget: "province",
    payloadParts: [{ label: "GET weather/province", path: "weather/province" }],
  },
  {
    label: "Sunspots",
    feedKey: "sunspots",
    refreshTarget: "sunspots",
    payloadParts: [{ label: "GET weather/sunspots", path: "weather/sunspots" }],
  },
  {
    label: "Canada hot / cold spots",
    feedKey: "hot_cold",
    refreshTarget: "hot_cold",
    payloadParts: [{ label: "GET weather/hotColdSpots", path: "weather/hotColdSpots" }],
  },
  {
    label: "Alerts (CAP maintenance)",
    feedKey: "alerts",
    refreshTarget: "alerts",
    payloadParts: [{ label: "GET weather/alerts", path: "weather/alerts" }],
  },
  {
    label: "Historical bulk (climatedata)",
    feedKey: "historical",
    refreshTarget: "historical",
    payloadParts: [
      { label: "GET season/", path: "season/" },
      { label: "GET season/lastmonth", path: "season/lastmonth" },
    ],
  },
  {
    label: "Climate normals",
    feedKey: "climate_normals",
    refreshTarget: "climate_normals",
    payloadParts: [{ label: "GET season/lastmonth", path: "season/lastmonth" }],
  },
  {
    label: "AQHI",
    feedKey: "aqhi",
    refreshTarget: "aqhi",
    payloadParts: [{ label: "GET airquality", path: "airquality" }],
  },
];

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const StatusScreen = () => {
  const [tokenInput, setTokenInput] = useState("");
  const [snapshot, setSnapshot] = useState<StatusPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [disabledBanner, setDisabledBanner] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [payloadLoading, setPayloadLoading] = useState<string | null>(null);
  const [payloadErrorByKey, setPayloadErrorByKey] = useState<Record<string, string>>({});
  const [payloadCache, setPayloadCache] = useState<Record<string, { title: string; body: string }[]>>({});

  useEffect(() => {
    const id = axios.interceptors.request.use((cfg) => {
      const t = sessionStorage.getItem(BEARER_KEY);
      if (t) cfg.headers.Authorization = `Bearer ${t}`;
      return cfg;
    });
    return () => axios.interceptors.eject(id);
  }, []);

  const load = useCallback(() => {
    setLoadError(null);
    setDisabledBanner(false);
    setUnauthorized(false);
    axios
      .get<StatusPayload>("status")
      .then((r) => setSnapshot(r.data))
      .catch((err) => {
        const status = err?.response?.status;
        const data = err?.response?.data;
        if (status === 404 && data?.error === "status_disabled") {
          setDisabledBanner(true);
          setSnapshot(null);
          return;
        }
        if (status === 401) {
          setUnauthorized(true);
          setSnapshot(null);
          return;
        }
        setLoadError(err?.message ?? "Failed to load status");
        setSnapshot(null);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveToken = () => {
    const t = tokenInput.trim();
    if (t) sessionStorage.setItem(BEARER_KEY, t);
    else sessionStorage.removeItem(BEARER_KEY);
    load();
  };

  const postRefresh = (scope: "all" | "single", target?: string) => {
    setRefreshBusy(true);
    const body = scope === "all" ? { scope: "all" } : { scope: "single", target };
    axios
      .post("status/refresh", body)
      .then(() => load())
      .catch((err) => setLoadError(err?.message ?? "Refresh request failed"))
      .finally(() => setRefreshBusy(false));
  };

  const togglePayload = async (row: RowDef) => {
    if (expandedKey === row.feedKey) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(row.feedKey);
    setPayloadErrorByKey((e) => {
      const next = { ...e };
      delete next[row.feedKey];
      return next;
    });
    if (payloadCache[row.feedKey]) return;

    setPayloadLoading(row.feedKey);
    try {
      const blocks = await Promise.all(
        row.payloadParts.map(async (p) => {
          const { data } = await axios.get(p.path);
          return { title: p.label, body: JSON.stringify(data, null, 2) };
        })
      );
      setPayloadCache((c) => ({ ...c, [row.feedKey]: blocks }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPayloadErrorByKey((prev) => ({ ...prev, [row.feedKey]: msg }));
    } finally {
      setPayloadLoading(null);
    }
  };

  return (
    <Stack spacing={4} align="stretch">
      <Heading size="lg">Retro ECCC — data status</Heading>
      <Text fontSize="sm" color="gray.600">
        Read-only snapshot of in-memory feeds. GET does not refetch upstreams. Refresh triggers the same code paths as
        timers / AMQP (circuits and retries still apply). Expand <strong>Payload</strong> to fetch the same JSON the
        display bundle uses (lazy, one block per API path).
      </Text>

      {unauthorized && (
        <Box borderWidth="1px" borderRadius="md" p={3} bg="orange.50">
          <Text fontWeight="bold">Authentication required</Text>
          <Text fontSize="sm" mt={1}>
            Set <code>RWC_STATUS_TOKEN</code> or <code>RWC_METRICS_TOKEN</code> on the server, then paste the same
            bearer value here (stored in session storage for this tab only).
          </Text>
          <Stack direction="row" mt={2} spacing={2}>
            <Input
              placeholder="Bearer token"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              maxW="sm"
            />
            <Button onClick={saveToken}>Save token & reload</Button>
          </Stack>
        </Box>
      )}

      {disabledBanner && (
        <Box borderWidth="1px" borderRadius="md" p={3} bg="yellow.50">
          <Text fontWeight="bold">Status API disabled</Text>
          <Text fontSize="sm" mt={1}>
            Set <code>RWC_STATUS_ENABLED=1</code> in production, or run with <code>NODE_ENV</code> other than{" "}
            <code>production</code>.
          </Text>
        </Box>
      )}

      {loadError && (
        <Text color="red.500" fontSize="sm">
          {loadError}
        </Text>
      )}

      {snapshot && (
        <>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button colorScheme="blue" onClick={() => postRefresh("all")} isLoading={refreshBusy} loadingText="Refreshing">
              Refresh all feeds
            </Button>
            <Button variant="outline" onClick={load} isDisabled={refreshBusy}>
              Reload snapshot
            </Button>
          </Stack>

          <Box fontSize="sm">
            <Text>
              Uptime: <strong>{snapshot.server.uptimeSec}s</strong> · Version:{" "}
              <strong>{snapshot.server.packageVersion}</strong> · NODE_ENV: <strong>{snapshot.server.nodeEnv}</strong> ·
              schema: <strong>{snapshot.statusSchemaVersion}</strong>
            </Text>
          </Box>

          <TableContainer>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th w="100px">Payload</Th>
                  <Th>Feed</Th>
                  <Th>Source</Th>
                  <Th>Last success (data)</Th>
                  <Th>Served as-of</Th>
                  <Th>Details</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {ROWS.map((row) => {
                  const block = snapshot.feeds[row.feedKey];
                  const details =
                    row.feedKey === "citypage" && block?.observationId
                      ? `obs ${block.observationId}`
                      : row.feedKey === "alerts" && block?.count != null
                        ? `${block.count} active`
                        : block?.note ?? "—";
                  const open = expandedKey === row.feedKey;
                  const loading = payloadLoading === row.feedKey;
                  const blocks = payloadCache[row.feedKey];
                  const rowPayloadErr = payloadErrorByKey[row.feedKey];
                  return (
                    <Fragment key={row.feedKey}>
                      <Tr>
                        <Td verticalAlign="top">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => void togglePayload(row)}
                            isLoading={loading}
                          >
                            {open ? "Hide" : "Show"}
                          </Button>
                        </Td>
                        <Td>{row.label}</Td>
                        <Td>{block?.source ?? "—"}</Td>
                        <Td>{formatTime(block?.dataFetchedAt)}</Td>
                        <Td>{formatTime(block?.servedDataAsOf)}</Td>
                        <Td fontSize="xs">{details}</Td>
                        <Td>
                          <Button
                            size="xs"
                            onClick={() => postRefresh("single", row.refreshTarget)}
                            isDisabled={refreshBusy}
                          >
                            Refresh
                          </Button>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td colSpan={7} p={0} border="none">
                          <Collapse in={open} animateOpacity>
                            <Box px={2} py={3} bg="gray.50" borderTopWidth="1px">
                              {rowPayloadErr ? (
                                <Text color="red.500" fontSize="sm" mb={2}>
                                  {rowPayloadErr}
                                </Text>
                              ) : null}
                              {blocks?.map((b) => (
                                <Box key={b.title} mb={3} _last={{ mb: 0 }}>
                                  <Text fontSize="xs" fontWeight="bold" mb={1}>
                                    {b.title}
                                  </Text>
                                  <Box
                                    as="pre"
                                    fontSize="xs"
                                    overflow="auto"
                                    maxH="280px"
                                    p={2}
                                    bg="white"
                                    borderWidth="1px"
                                    borderRadius="md"
                                    whiteSpace="pre"
                                  >
                                    {b.body}
                                  </Box>
                                </Box>
                              ))}
                              {open && loading ? (
                                <Text fontSize="xs" color="gray.600">
                                  Fetching display client JSON…
                                </Text>
                              ) : null}
                            </Box>
                          </Collapse>
                        </Td>
                      </Tr>
                    </Fragment>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        </>
      )}
    </Stack>
  );
};

const root = ReactDOM.createRoot(document.getElementById("status-root") as HTMLElement);
root.render(
  <React.StrictMode>
    <ChakraProvider>
      <StatusScreen />
    </ChakraProvider>
  </React.StrictMode>
);
