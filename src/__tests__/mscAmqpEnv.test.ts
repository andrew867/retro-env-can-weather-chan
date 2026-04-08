import { mscAmqpListenOptionsFromEnv } from "lib/amqp/mscAmqpEnv";

describe("mscAmqpListenOptionsFromEnv", () => {
  afterEach(() => {
    delete process.env.RWC_AMQP_HOST;
    delete process.env.RWC_AMQP_PORT;
    delete process.env.RWC_AMQP_USER;
    delete process.env.RWC_AMQP_PASSWORD;
    delete process.env.RWC_AMQP_RECONNECT_LIMIT_MS;
  });

  it("returns empty object when no env set", () => {
    expect(mscAmqpListenOptionsFromEnv()).toEqual({});
  });

  it("maps host and port when set", () => {
    process.env.RWC_AMQP_HOST = "dd.weather.gc.ca";
    process.env.RWC_AMQP_PORT = "5671";
    expect(mscAmqpListenOptionsFromEnv()).toEqual({
      amqp_host: "dd.weather.gc.ca",
      amqp_port: 5671,
    });
  });

  it("maps RWC_AMQP_RECONNECT_LIMIT_MS to amqp_reconnect_limit_ms", () => {
    process.env.RWC_AMQP_RECONNECT_LIMIT_MS = "300000";
    expect(mscAmqpListenOptionsFromEnv()).toEqual({ amqp_reconnect_limit_ms: 300000 });
  });
});
