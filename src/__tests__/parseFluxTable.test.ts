import { latestFluxFromTableText, parseFluxTable } from "lib/solarFlux/parseFluxTable";

const SNIPPET = `
fluxdate    fluxtime    fluxjulian    fluxcarrington  fluxobsflux  fluxadjflux  fluxursi  
----------  ----------  ------------  --------------  -----------  -----------  ----------
20041112    180000      02453322.271  002023.157      000096.4     000094.4     000085.0  
20041112    200000      02453322.356  002023.160      000096.0     000094.0     000084.6  
20041112    220000      02453322.437  002023.163      000096.3     000094.3     000084.9  
`;

describe("parseFluxTable", () => {
  it("parses all data rows", () => {
    const rows = parseFluxTable(SNIPPET);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      fluxDate: "20041112",
      fluxTime: "180000",
      observedSfU: 96.4,
      adjustedSfU: 94.4,
      ursiSfU: 85.0,
    });
  });

  it("returns the chronologically last row as latest", () => {
    const latest = latestFluxFromTableText(SNIPPET);
    expect(latest).toMatchObject({
      fluxDate: "20041112",
      fluxTime: "220000",
      adjustedSfU: 94.3,
    });
  });
});
