/**
 * MSC Datamart public AMQP (Sarracenia-style notifications). Defaults match ECCC docs.
 * Override with env for staging or broker failover without code changes.
 */
export type MscAmqpListenOverrides = {
  amqp_host?: string;
  amqp_port?: number;
  amqp_user?: string;
  amqp_password?: string;
  /** Passed to `amqp` `reconnectExponentialLimit` (ms). Default in listener: 120000. */
  amqp_reconnect_limit_ms?: number;
};

function parsePort(raw: string | undefined): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseReconnectLimitMs(raw: string | undefined): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Merge into `listen()` options from process.env (RWC_AMQP_*). */
export function mscAmqpListenOptionsFromEnv(): MscAmqpListenOverrides {
  const host = process.env.RWC_AMQP_HOST?.trim();
  const port = parsePort(process.env.RWC_AMQP_PORT);
  const user = process.env.RWC_AMQP_USER?.trim();
  const password = process.env.RWC_AMQP_PASSWORD?.trim();
  const reconnectLimit = parseReconnectLimitMs(process.env.RWC_AMQP_RECONNECT_LIMIT_MS);
  const out: MscAmqpListenOverrides = {};
  if (host) out.amqp_host = host;
  if (port !== undefined) out.amqp_port = port;
  if (user) out.amqp_user = user;
  if (password !== undefined) out.amqp_password = password;
  if (reconnectLimit !== undefined) out.amqp_reconnect_limit_ms = reconnectLimit;
  return out;
}
