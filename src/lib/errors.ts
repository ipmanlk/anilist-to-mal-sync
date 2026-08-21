export type ExitCode = 0 | 2 | 3 | 10

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: ExitCode,
    readonly details?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = this.constructor.name
  }
}

export class CliError extends AppError {
  constructor(message: string) {
    super(message, 2)
  }
}

export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, 2)
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 2)
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    readonly status?: number,
    details?: unknown,
  ) {
    super(message, 3, details)
  }
}

export class NotFoundError extends ApiError {}

export class RateLimitError extends ApiError {
  constructor(readonly retryAfterMs: number) {
    super(`MAL rate limit — retry after ${Math.round(retryAfterMs / 1000)}s`, undefined, {
      retryAfterMs,
    })
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string,
    readonly status?: number,
    details?: unknown,
  ) {
    super(message, 3, details, { cause: details })
  }
}

export class TimeoutReachedError extends NetworkError {}

export class CancelledError extends AppError {
  constructor(message = 'cancelled') {
    super(message, 0)
  }
}

export class PartialSyncError extends AppError {
  constructor(message: string) {
    super(message, 10)
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message
  if (err instanceof Error) return `Unknown error: ${err.name}: ${err.message}`
  return `Unknown error: ${String(err)}`
}

export function toExitCode(err: unknown): ExitCode {
  if (err instanceof AppError) return err.code
  return 3
}
