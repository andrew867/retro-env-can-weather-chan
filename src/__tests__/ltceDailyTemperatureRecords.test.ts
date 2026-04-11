import type { AxiosInstance } from "axios";
import {
  fetchLtceDailyTemperatureExtremes,
  parseLtceTemperatureCsv,
  resetLtceTemperatureCacheForTests,
} from "lib/eccc/ltceDailyTemperatureRecords";

const MINIMAL_LTCE_CSV = [
  "RECORD_HIGH_MAX_TEMP,RECORD_HIGH_MAX_TEMP_YR,RECORD_LOW_MIN_TEMP,RECORD_LOW_MIN_TEMP_YR",
  "25,1968,-22.8,1881",
].join("\n");

describe("ltceDailyTemperatureRecords", () => {
  const prevFetch = process.env.RWC_LTCE_JEST_FETCH;

  beforeAll(() => {
    process.env.RWC_LTCE_JEST_FETCH = "1";
  });

  afterAll(() => {
    if (prevFetch === undefined) delete process.env.RWC_LTCE_JEST_FETCH;
    else process.env.RWC_LTCE_JEST_FETCH = prevFetch;
  });

  beforeEach(() => {
    resetLtceTemperatureCacheForTests();
  });

  it("parseLtceTemperatureCsv maps record high max and low min + years", () => {
    expect(parseLtceTemperatureCsv(MINIMAL_LTCE_CSV)).toStrictEqual({
      extremeMax: { value: 25, year: 1968, unit: "C" },
      extremeMin: { value: -22.8, year: 1881, unit: "C" },
    });
  });

  it("parseLtceTemperatureCsv returns null for empty or header-only CSV", () => {
    expect(parseLtceTemperatureCsv("")).toBeNull();
    expect(parseLtceTemperatureCsv("RECORD_HIGH_MAX_TEMP\n")).toBeNull();
  });

  it("fetchLtceDailyTemperatureExtremes caches by virtual id + local calendar day", async () => {
    const get = jest.fn().mockResolvedValue({ data: MINIMAL_LTCE_CSV });
    const axiosMock = { get } as unknown as AxiosInstance;

    const a = await fetchLtceDailyTemperatureExtremes("VSMB38V", 4, 11, axiosMock);
    const b = await fetchLtceDailyTemperatureExtremes("VSMB38V", 4, 11, axiosMock);

    expect(a).toStrictEqual(b);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
