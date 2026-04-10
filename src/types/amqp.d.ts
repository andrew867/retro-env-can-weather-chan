/** No `@types/amqp` in tree; satisfy `import * as amqp from "amqp"` in tests. */
declare module "amqp" {
  export function createConnection(...args: unknown[]): unknown;
}

