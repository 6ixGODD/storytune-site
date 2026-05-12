/**
 * @file lib/logger.ts
 * Structured application logger built on [pino](https://github.com/pinojs/pino).
 *
 * In development the output is formatted by `pino-pretty` (colourised, human-readable).
 * In production it emits newline-delimited JSON, suitable for log aggregators.
 *
 * The log level defaults to `"debug"` in development and `"info"` in production but
 * can be overridden via the `STORYTUNE__LOG_LEVEL` environment variable.
 *
 * @example
 * ```ts
 * import { createLogger } from '@/lib/logger';
 * const log = createLogger('card.service');
 * log.info({ slug }, 'card uploaded');
 * ```
 */
import pino from 'pino';

import { config } from '@/lib/config';

const level = config.logger.level ?? (config.isDev ? 'debug' : 'info');

const transport = config.isDev
    ? {
          target: 'pino-pretty',
          options: {
              colorize: true,
              translateTime: 'SYS:HH:MM:ss',
              ignore: 'pid,hostname',
              messageFormat: '[{module}] {msg}',
          },
      }
    : undefined;

/** Root pino logger instance. Prefer `createLogger` for module-scoped loggers. */
export const logger = pino({ level, transport });

/**
 * Create a child logger bound to a specific module name.
 *
 * The module name is included in every log line, making it easy to filter logs
 * by origin in both pretty-print and JSON modes.
 *
 * @param module - Dot-separated module identifier, e.g. `"card.service"`.
 * @returns A pino child logger with `{ module }` bound to every record.
 *
 * @example
 * ```ts
 * const log = createLogger('infra.mail');
 * log.warn({ to }, 'email delivery failed');
 * ```
 */
export const createLogger = (module: string) => logger.child({ module });
