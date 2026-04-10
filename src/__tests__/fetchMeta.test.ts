import type { AxiosResponse } from "axios";
import { getDataFetchedAtHeader } from "lib/fetchMeta";

describe("getDataFetchedAtHeader", () => {
  it("reads lowercased header object", () => {
    const resp = {
      headers: { "x-rwc-data-fetched-at": "2026-04-07T10:00:00.000Z" },
    } as unknown as AxiosResponse<unknown>;
    expect(getDataFetchedAtHeader(resp)).toBe("2026-04-07T10:00:00.000Z");
  });

  it("returns null when absent", () => {
    const resp = { headers: {} } as unknown as AxiosResponse<unknown>;
    expect(getDataFetchedAtHeader(resp)).toBeNull();
  });
});
