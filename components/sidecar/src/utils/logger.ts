/**
 * Structured Logger
 *
 * Provides consistent logging format with component prefix and optional trace context.
 * Output format: [component] [timestamp] [level] message {context}
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger context with optional trace information.
 */
export interface LogContext {
  traceId?: string;
  spanId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

/**
 * Structured log entry.
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: LogContext;
}

/**
 * Logger configuration.
 */
export interface LoggerConfig {
  component: string;
  level?: LogLevel;
  json?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Structured logger class.
 */
export class Logger {
  private readonly component: string;
  private readonly minLevel: number;
  private readonly json: boolean;

  constructor(config: LoggerConfig) {
    this.component = config.component;
    this.minLevel = LOG_LEVELS[config.level || 'info'];
    this.json = config.json ?? false;
  }

  /**
   * Log a debug message.
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message.
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message.
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message.
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Create a child logger with additional context.
   */
  child(context: LogContext): ContextualLogger {
    return new ContextualLogger(this, context);
  }

  /**
   * Internal log method.
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (LOG_LEVELS[level] < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      context,
    };

    if (this.json) {
      this.outputJson(entry);
    } else {
      this.outputText(entry);
    }
  }

  /**
   * Output log entry as JSON.
   */
  private outputJson(entry: LogEntry): void {
    const output = JSON.stringify(entry);
    this.write(entry.level, output);
  }

  /**
   * Output log entry as formatted text.
   */
  private outputText(entry: LogEntry): void {
    let output = `[${entry.component}] ${entry.message}`;

    // Add trace context if present
    if (entry.context?.traceId) {
      output += ` [trace:${entry.context.traceId.slice(0, 8)}]`;
    }
    if (entry.context?.correlationId) {
      output += ` [corr:${entry.context.correlationId.slice(0, 8)}]`;
    }

    // Add additional context keys (excluding standard ones)
    const extraKeys = Object.keys(entry.context || {}).filter(
      (k) => !['traceId', 'spanId', 'correlationId'].includes(k)
    );
    if (extraKeys.length > 0) {
      const extra = extraKeys.reduce(
        (acc, k) => {
          acc[k] = entry.context![k];
          return acc;
        },
        {} as Record<string, unknown>
      );
      output += ` ${JSON.stringify(extra)}`;
    }

    this.write(entry.level, output);
  }

  /**
   * Write to console with appropriate method.
   */
  private write(level: LogLevel, message: string): void {
    switch (level) {
      case 'debug':
        console.debug(message);
        break;
      case 'info':
        console.log(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
    }
  }
}

/**
 * Logger with bound context.
 */
export class ContextualLogger {
  private readonly parent: Logger;
  private readonly context: LogContext;

  constructor(parent: Logger, context: LogContext) {
    this.parent = parent;
    this.context = context;
  }

  debug(message: string, extra?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...extra });
  }

  info(message: string, extra?: LogContext): void {
    this.parent.info(message, { ...this.context, ...extra });
  }

  warn(message: string, extra?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...extra });
  }

  error(message: string, extra?: LogContext): void {
    this.parent.error(message, { ...this.context, ...extra });
  }
}

/**
 * Create a logger for a component.
 * Default log level is 'info'. Use LOG_LEVEL=debug for verbose payload logging.
 */
export function createLogger(component: string): Logger {
  const level = (process.env.LOG_LEVEL as LogLevel) || 'info';
  const json = process.env.LOG_FORMAT === 'json';
  return new Logger({ component, level, json });
}

// Pre-configured loggers for common components
export const loggers = {
  sidecar: createLogger('sidecar'),
  redis: createLogger('redis'),
  subscriber: createLogger('subscriber'),
  publisher: createLogger('publisher'),
  invoker: createLogger('invoker'),
  command: createLogger('command'),
  tracer: createLogger('tracer'),
  health: createLogger('health'),
  transformer: createLogger('transformer'),
};
