import { Request, Response } from "express";
import { attachConditionsSse } from "lib/eccc/sseLive";

function mockReqRes() {
  const reqListeners: Record<string, (() => void)[]> = {};
  const req = {
    on: jest.fn((event: string, cb: () => void) => {
      reqListeners[event] = reqListeners[event] ?? [];
      reqListeners[event].push(cb);
      return req;
    }),
    emitClose: () => (reqListeners["close"] ?? []).forEach((cb) => cb()),
  } as unknown as Request & { emitClose: () => void };

  let writableEnded = false;
  const chunks: string[] = [];
  const resListeners: Record<string, (() => void)[]> = {};
  const res = {
    writableEnded,
    writeHead: jest.fn(),
    write: jest.fn((c: string) => {
      chunks.push(c);
      return true;
    }),
    end: jest.fn(),
    on: jest.fn((event: string, cb: () => void) => {
      resListeners[event] = resListeners[event] ?? [];
      resListeners[event].push(cb);
      return res;
    }),
    emitClose: () => {
      Object.defineProperty(res, "writableEnded", { value: true, configurable: true });
      (resListeners["close"] ?? []).forEach((cb) => cb());
    },
  } as unknown as Response & { emitClose: () => void; writableEnded: boolean };

  return { req, res, chunks };
}

describe("attachConditionsSse", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends an immediate event then repeats on interval", () => {
    const { req, res, chunks } = mockReqRes();
    let n = 0;
    attachConditionsSse(req, res, {
      intervalMs: 5000,
      eventName: "condition_update",
      getData: () => ({ n: ++n }),
    });

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(chunks.join("")).toContain("event: condition_update");
    expect(chunks.join("")).toContain('"n":1');

    jest.advanceTimersByTime(5000);
    expect(chunks.join("")).toContain('"n":2');
  });

  it("keeps independent timers for two connections (multi-client / OBS)", () => {
    const a = mockReqRes();
    const b = mockReqRes();
    let aCalls = 0;
    let bCalls = 0;

    attachConditionsSse(a.req, a.res, {
      intervalMs: 5000,
      eventName: "condition_update",
      getData: () => ({ side: "a", c: ++aCalls }),
    });
    attachConditionsSse(b.req, b.res, {
      intervalMs: 5000,
      eventName: "condition_update",
      getData: () => ({ side: "b", c: ++bCalls }),
    });

    jest.advanceTimersByTime(5000);

    expect(a.chunks.join("")).toContain('"side":"a"');
    expect(a.chunks.join("")).toContain('"c":2');
    expect(b.chunks.join("")).toContain('"side":"b"');
    expect(b.chunks.join("")).toContain('"c":2');
  });

  it("stops pushing after req close", () => {
    const { req, res, chunks } = mockReqRes();
    attachConditionsSse(req, res, {
      intervalMs: 5000,
      eventName: "condition_update",
      getData: () => ({ t: Date.now() }),
    });
    const afterFirst = chunks.length;
    (req as unknown as { emitClose: () => void }).emitClose();
    jest.advanceTimersByTime(15000);
    expect(chunks.length).toBe(afterFirst);
  });
});
