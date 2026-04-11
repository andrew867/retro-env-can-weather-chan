import { parseClimateNormalsCsv } from "lib/eccc/climateNormals";

const CSV_COLUMNS = [
  "x",
  "y",
  "STATION_NAME",
  "CLIMATE_IDENTIFIER",
  "ID",
  "PERIOD",
  "CURRENT_FLAG",
  "NORMAL_CODE",
  "NORMAL_ID",
  "PUBLICATION_CODE",
  "DATE_CALCULATED",
  "FIRST_OCCURRENCE_DATE",
  "PROVINCE_CODE",
  "PERIOD_BEGIN",
  "PERIOD_END",
  "FIRST_YEAR",
  "FIRST_YEAR_NORMAL_PERIOD",
  "LAST_YEAR",
  "LAST_YEAR_NORMAL_PERIOD",
  "YEAR_COUNT_NORMAL_PERIOD",
  "TOTAL_OBS_COUNT",
  "OCCURRENCE_COUNT",
  "MAX_DURATION_MISSING_YEARS",
  "PERCENT_OF_POSSIBLE_OBS",
  "E_NORMAL_ELEMENT_NAME",
  "F_NORMAL_ELEMENT_NAME",
  "MONTH",
  "VALUE",
  "STN_ID",
] as const;

function makeCsvRow(overrides: Partial<Record<(typeof CSV_COLUMNS)[number], string>>): string {
  return CSV_COLUMNS.map((c) => overrides[c] ?? "").join(",");
}

describe("parseClimateNormalsCsv", () => {
  it("indexes NORMAL_ID and MONTH into a lookup map", () => {
    const header = CSV_COLUMNS.join(",");
    const row1 = makeCsvRow({
      CURRENT_FLAG: "Y",
      NORMAL_CODE: "A",
      NORMAL_ID: "56",
      MONTH: "3",
      VALUE: "142.5",
    });
    const row2 = makeCsvRow({
      CURRENT_FLAG: "Y",
      NORMAL_CODE: "A",
      NORMAL_ID: "5",
      MONTH: "3",
      VALUE: "12.3",
    });
    const csv = `${header}\n${row1}\n${row2}\n`;
    const map = parseClimateNormalsCsv(csv);
    expect(map.get("56-3")).toBe(142.5);
    expect(map.get("5-3")).toBe(12.3);
  });

  it("skips non-current rows; prefers NORMAL_CODE A over B/C for the same NORMAL_ID+MONTH", () => {
    const header = CSV_COLUMNS.join(",");
    const skip1 = makeCsvRow({
      CURRENT_FLAG: "N",
      NORMAL_CODE: "A",
      NORMAL_ID: "1",
      MONTH: "1",
      VALUE: "9",
    });
    const tierB = makeCsvRow({
      CURRENT_FLAG: "Y",
      NORMAL_CODE: "B",
      NORMAL_ID: "1",
      MONTH: "1",
      VALUE: "9",
    });
    const tierA = makeCsvRow({
      CURRENT_FLAG: "Y",
      NORMAL_CODE: "A",
      NORMAL_ID: "1",
      MONTH: "1",
      VALUE: "-4",
    });
    const map = parseClimateNormalsCsv(`${header}\n${skip1}\n${tierB}\n${tierA}\n`);
    expect(map.get("1-1")).toBe(-4);
  });

  it("accepts NORMAL_CODE B–D when no A row exists (ECCC composite stations often use C for temps)", () => {
    const header = CSV_COLUMNS.join(",");
    const row = makeCsvRow({
      CURRENT_FLAG: "Y",
      NORMAL_CODE: "C",
      NORMAL_ID: "1",
      MONTH: "3",
      VALUE: "2.5",
    });
    const map = parseClimateNormalsCsv(`${header}\n${row}\n`);
    expect(map.get("1-3")).toBe(2.5);
  });

  it("skips unknown NORMAL_CODE letters", () => {
    const header = CSV_COLUMNS.join(",");
    const row = makeCsvRow({
      CURRENT_FLAG: "Y",
      NORMAL_CODE: "E",
      NORMAL_ID: "1",
      MONTH: "1",
      VALUE: "1",
    });
    const map = parseClimateNormalsCsv(`${header}\n${row}\n`);
    expect(map.get("1-1")).toBeUndefined();
  });

  it("parses quoted fields containing commas", () => {
    const header = CSV_COLUMNS.join(",");
    const row = makeCsvRow({
      CURRENT_FLAG: "Y",
      NORMAL_CODE: "A",
      NORMAL_ID: "69",
      MONTH: "2",
      VALUE: "18.5",
      E_NORMAL_ELEMENT_NAME: '"Jours avec précipitations >= 0,2 mm"',
    });
    const map = parseClimateNormalsCsv(`${header}\n${row}\n`);
    expect(map.get("69-2")).toBe(18.5);
  });
});
