/**
 * @file lib/logger.ts
 * Structured application logger built on [pino](https://github.com/pinojs/pino).
 *
 * Output targets are configured via `STORYTUNE__LOG_TARGETS` (see `lib/config.ts`).
 * Each target can be `stdout`, `stderr`, or a file path.  File targets support
 * size-based log rotation: when a file reaches the configured `maxSizeMb` limit it
 * is renamed to `<path>.1` and a fresh file is opened.
 *
 * Console targets are pretty-printed by `pino-pretty` in development mode and emit
 * raw NDJSON in production.  File targets always receive raw NDJSON regardless of
 * `NODE_ENV`.
 *
 * All targets receive every log line at or above the configured `level`.  Use
 * `pino.multistream` internally so the pino instance writes a single serialised
 * record that is then fanned out to all destinations.
 *
 * @example
 * ```ts
 * import { createLogger } from '@/lib/logger';
 * const log = createLogger('card.service');
 * log.info({ slug }, 'card uploaded');
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { Writable } from 'node:stream';

import pino from 'pino';

import { config } from '@/lib/config';

// ── Rotating file stream ──────────────────────────────────────────────────────

/**
 * A `Writable` stream that appends log lines to a file and rotates it by size.
 *
 * When the accumulated bytes written in the current file would exceed `maxBytes`,
 * the file is renamed to `<filePath>.1` (overwriting any previous backup) and a
 * new file is opened before writing the current chunk.
 *
 * This implementation is intentionally minimal — no compression, no multi-backup
 * chain.  The single `.1` backup retains the most recent complete log segment.
 */
class RotatingFileStream extends Writable {
    private readonly filePath: string;
    private readonly maxBytes: number;
    private stream: fs.WriteStream;
    private bytesWritten: number = 0;

    constructor(filePath: string, maxSizeMb: number) {
        super();
        this.filePath = filePath;
        this.maxBytes = maxSizeMb * 1024 * 1024;
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        this.stream = this.openStream();
        // Seed bytesWritten from existing file size so rotation is size-accurate
        // across process restarts.
        try {
            this.bytesWritten = fs.statSync(filePath).size;
        } catch {
            this.bytesWritten = 0;
        }
    }

    private openStream(): fs.WriteStream {
        return fs.createWriteStream(this.filePath, { flags: 'a' });
    }

    private rotate(): void {
        this.stream.end();
        const backup = `${this.filePath}.1`;
        try {
            fs.unlinkSync(backup);
        } catch {
            // backup may not exist yet — that's fine
        }
        fs.renameSync(this.filePath, backup);
        this.stream = this.openStream();
        this.bytesWritten = 0;
    }

    _write(chunk: Buffer | string, _encoding: BufferEncoding, callback: (err?: Error | null) => void): void {
        const bytes = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk as string);
        if (this.bytesWritten + bytes > this.maxBytes) {
            this.rotate();
        }
        this.stream.write(chunk, (err) => callback(err ?? null));
        this.bytesWritten += bytes;
    }

    _final(callback: () => void): void {
        this.stream.end(callback);
    }
}

// ── Stream builder ────────────────────────────────────────────────────────────

type StreamEntry = pino.StreamEntry;

function buildStreams(): StreamEntry[] {
    const level = config.logger.level ?? (config.isDev ? 'debug' : 'info');
    const targets = config.logger.targets;

    return targets.map((t) => {
        if (t.type === 'stdout' || t.type === 'stderr') {
            const raw: Writable = t.type === 'stdout' ? process.stdout : process.stderr;

            if (config.isDev) {
                // pino-pretty is a transform stream; pipe pino NDJSON through it.
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const pretty = require('pino-pretty') as (opts: Record<string, unknown>) => Writable;
                const prettyStream = pretty({
                    colorize: true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname',
                    messageFormat: '[{module}] {msg}',
                    destination: raw,
                    sync: true,
                });
                return { stream: prettyStream, level } as StreamEntry;
            }

            return { stream: raw, level } as StreamEntry;
        }

        // file target — always raw NDJSON
        return { stream: new RotatingFileStream(t.path, t.maxSizeMb), level } as StreamEntry;
    });
}

// ── Logger factory ────────────────────────────────────────────────────────────

const level = config.logger.level ?? (config.isDev ? 'debug' : 'info');
const streams = buildStreams();

/** Root pino logger instance. Prefer `createLogger` for module-scoped loggers. */
export const logger = pino({ level }, pino.multistream(streams));

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
