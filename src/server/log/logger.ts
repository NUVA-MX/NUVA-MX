import 'server-only';
import { getEnvSafe } from '@/server/env';
import { redact, redactString } from './redact';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export type LogSink = (line: string, level: LogLevel) => void;

const defaultSink: LogSink = (line, level) => {
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
};

let sink: LogSink = defaultSink;
let levelOverride: LogLevel | undefined;

/** Test helpers. */
export function setLogSink(next: LogSink | null): void {
  sink = next ?? defaultSink;
}
export function setLogLevel(level: LogLevel | undefined): void {
  levelOverride = level;
}

function activeLevel(): LogLevel {
  return levelOverride ?? getEnvSafe()?.logLevel ?? 'info';
}

export type Logger = {
  debug(event: string, fields?: Record<string, unknown>): void;
  info(event: string, fields?: Record<string, unknown>): void;
  warn(event: string, fields?: Record<string, unknown>): void;
  error(event: string, fields?: Record<string, unknown>): void;
  child(base: Record<string, unknown>): Logger;
};

function emit(level: LogLevel, event: string, base: Record<string, unknown>, fields?: Record<string, unknown>) {
  if (ORDER[level] < ORDER[activeLevel()]) return;
  const merged = { ...base, ...fields };
  const { requestId, ...rest } = merged;
  // Reserved keys are written after the redacted fields so callers cannot spoof them.
  const safe = redact(rest) as Record<string, unknown>;
  const line = JSON.stringify({
    ...safe,
    ts: new Date().toISOString(),
    level,
    event: redactString(event),
    requestId: typeof requestId === 'string' ? redactString(requestId) : undefined,
  });
  try {
    sink(line, level);
  } catch {
    // Logging must never break the caller.
  }
}

export function createLogger(base: Record<string, unknown> = {}): Logger {
  return {
    debug: (e, f) => emit('debug', e, base, f),
    info: (e, f) => emit('info', e, base, f),
    warn: (e, f) => emit('warn', e, base, f),
    error: (e, f) => emit('error', e, base, f),
    child: (more) => createLogger({ ...base, ...more }),
  };
}

export const log = createLogger();
