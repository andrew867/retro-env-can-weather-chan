import { mscAmqpListenOptionsFromEnv } from "lib/amqp/mscAmqpEnv";

describe("mscAmqpListenOptionsFromEnv", () => {
  afterEach(() => {
    delete process.env.RWC_AMQP_HOST;
    delete process.env.RWC_AMQP_PORT;
    delete process.env.RWC_AMQP_USER;
    delete process.env.RWC_AMQP_PASSWORD;
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
});
