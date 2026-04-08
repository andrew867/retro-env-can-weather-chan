/**
 * T4-style check: `listen()` forwards reconnect backoff settings to `amqp.createConnection`.
 */
jest.mock("amqp", () => ({
  createConnection: jest.fn(() => ({
    on: jest.fn(),
  })),
}));

import * as amqp from "amqp";
import { listen } from "lib/amqp/sarra-canada-amqp";

describe("sarra-canada-amqp listen()", () => {
  beforeEach(() => {
    (amqp.createConnection as jest.Mock).mockClear();
  });

  it("uses exponential reconnect with default limit (120s)", () => {
    listen({});
    expect(amqp.createConnection).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        reconnectBackoffStrategy: "exponential",
        reconnectExponentialLimit: 120000,
      })
    );
  });

  it("respects amqp_reconnect_limit_ms override", () => {
    listen({ amqp_reconnect_limit_ms: 999000 });
    expect(amqp.createConnection).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        reconnectBackoffStrategy: "exponential",
        reconnectExponentialLimit: 999000,
      })
    );
  });
});
