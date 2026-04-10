import {
  pickLastDailySsn,
  pickLastMonthlyIndices,
  pickPredictedForUtcMonth,
} from "lib/solarCycleSwpc/parseSwpcSolarCycle";

describe("pickLastDailySsn", () => {
  it("reads last row", () => {
    const rows = [
      { Obsdate: "2026-04-09T00:00:00", swpc_ssn: 40 },
      { Obsdate: "2026-04-10T00:00:00", swpc_ssn: 48.2 },
    ];
    expect(pickLastDailySsn(rows)).toStrictEqual({
      obsDateIso: "2026-04-10T00:00:00",
      swpcSsn: 48,
    });
  });

  it("returns null on empty", () => {
    expect(pickLastDailySsn([])).toBeNull();
    expect(pickLastDailySsn(null)).toBeNull();
  });
});

describe("pickLastMonthlyIndices", () => {
  it("skips trailing rows with negative SSN and takes prior", () => {
    const rows = [
      { "time-tag": "2026-02", ssn: 80, observed_swpc_ssn: 82, "f10.7": 120 },
      { "time-tag": "2026-03", ssn: 86, observed_swpc_ssn: 90, "f10.7": 130.66 },
      { "time-tag": "2026-04", ssn: -1, observed_swpc_ssn: -1, "f10.7": -1 },
    ];
    expect(pickLastMonthlyIndices(rows)).toStrictEqual({
      timeTag: "2026-03",
      ssn: 86,
      observedSwpcSsn: 90,
      f107: 131,
    });
  });
});

describe("pickPredictedForUtcMonth", () => {
  const pred = [
    { "time-tag": "2026-03", predicted_ssn: 109, "predicted_f10.7": 145.5 },
    { "time-tag": "2026-04", predicted_ssn: 109.3, "predicted_f10.7": 145.6 },
  ];

  it("matches exact month", () => {
    expect(pickPredictedForUtcMonth(pred, 2026, 4)).toStrictEqual({
      timeTag: "2026-04",
      predictedSsn: 109,
      predictedF107: 146,
    });
  });

  it("falls forward then last", () => {
    expect(pickPredictedForUtcMonth(pred, 2026, 5)).toStrictEqual({
      timeTag: "2026-04",
      predictedSsn: 109,
      predictedF107: 146,
    });
    const one = [{ "time-tag": "2026-01", predicted_ssn: 10, "predicted_f10.7": 70 }];
    expect(pickPredictedForUtcMonth(one, 1999, 1)).toStrictEqual({
      timeTag: "2026-01",
      predictedSsn: 10,
      predictedF107: 70,
    });
  });
});
