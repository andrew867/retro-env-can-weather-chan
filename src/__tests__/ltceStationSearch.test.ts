import type { AxiosInstance } from "axios";
import { searchLtceVirtualStations } from "lib/eccc/ltceStationSearch";

const WINNIPEG_FEATURE = {
  type: "Feature",
  properties: {
    VIRTUAL_CLIMATE_ID: "VSMB38V",
    VIRTUAL_STATION_NAME_E: "WINNIPEG AREA",
    WXO_CITY_CODE: "MB-38",
    PROVINCE_CODE: "MB",
  },
};

const WINNIPEG_DUP = {
  type: "Feature",
  properties: {
    VIRTUAL_CLIMATE_ID: "VSMB38V",
    VIRTUAL_STATION_NAME_E: "WINNIPEG AREA",
    WXO_CITY_CODE: "MB-38",
    PROVINCE_CODE: "MB",
  },
};

describe("searchLtceVirtualStations", () => {
  it("dedupes by VIRTUAL_CLIMATE_ID and maps fields", async () => {
    const get = jest.fn().mockResolvedValue({
      data: { features: [WINNIPEG_FEATURE, WINNIPEG_DUP] },
    });
    const axiosMock = { get } as unknown as AxiosInstance;

    const rows = await searchLtceVirtualStations("Winnipeg", axiosMock);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toStrictEqual({
      virtualClimateId: "VSMB38V",
      virtualStationNameEn: "WINNIPEG AREA",
      wxoCityCode: "MB-38",
      provinceCode: "MB",
    });
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining("VIRTUAL_STATION_NAME_E=WINNIPEG"),
      expect.any(Object)
    );
  });

  it("returns empty for short query without calling axios", async () => {
    const get = jest.fn();
    const axiosMock = { get } as unknown as AxiosInstance;
    expect(await searchLtceVirtualStations("x", axiosMock)).toEqual([]);
    expect(get).not.toHaveBeenCalled();
  });
});
