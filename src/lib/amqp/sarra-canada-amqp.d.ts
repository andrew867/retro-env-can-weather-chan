import type { EventEmitter } from "events";
import type { Connection } from "types/amqp.types";

export function listen(options?: Record<string, unknown>): { connection: Connection; emitter: EventEmitter };
