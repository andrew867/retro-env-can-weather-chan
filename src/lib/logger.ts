import { format } from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";
const LOG_LEVELS = ["debug", "notice", "warn", "error", "critical"] as const;
type ConsoleMethod = "debug" | "log" | "warn" | "error";

export type LogLevel = (typeof LOG_LEVELS)[number];

const LOG_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  notice: 20,
  warn: 30,
  error: 40,
  critical: 50,
};

const DEFAULT_LOG_LEVEL: LogLevel = "warn";
let activeLogLevel: LogLevel = normalizeLogLevel(process.env.RWC_LOG_LEVEL, DEFAULT_LOG_LEVEL);

export function normalizeLogLevel(raw: unknown, fallback: LogLevel = DEFAULT_LOG_LEVEL): LogLevel {
  if (typeof raw !== "string") return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "warning") return "warn";
  return (LOG_LEVELS as readonly string[]).includes(normalized) ? (normalized as LogLevel) : fallback;
}

export function setLogLevel(level: unknown): void {
  activeLogLevel = normalizeLogLevel(level, activeLogLevel);
}

export default class Logger {
  constructor(private readonly name: string) {}

  private formattedDate(): string {
    return format(Date.now(), DATE_FORMAT);
  }

  private shouldLog(level: LogLevel): boolean {
    if (process.env.NODE_ENV === "test") return false;
    return LOG_SEVERITY[level] >= LOG_SEVERITY[activeLogLevel];
  }

  private write(level: LogLevel, method: ConsoleMethod, message: string, ...optionalParams: any[]) {
    if (!this.shouldLog(level)) return;
    console[method](`[${this.formattedDate()}]`, `[${this.name.toUpperCase()}]`, message, ...optionalParams);
  }

  debug(message: string, ...optionalParams: any[]) {
    this.write("debug", "debug", message, ...optionalParams);
  }

  notice(message: string, ...optionalParams: any[]) {
    this.write("notice", "log", message, ...optionalParams);
  }

  log(message: string, ...optionalParams: any[]) {
    this.notice(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: any[]) {
    this.write("error", "error", message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]) {
    this.write("warn", "warn", message, ...optionalParams);
  }

  critical(message: string, ...optionalParams: any[]) {
    this.write("critical", "error", `[CRITICAL] ${message}`, ...optionalParams);
  }
}
