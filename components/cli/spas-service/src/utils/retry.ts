/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Backoff multiplier */
  multiplier?: number;
  /** Backoff multiplier (alias for multiplier) */
  backoffMultiplier?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Function to determine if an error should be retried */
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'backoffMultiplier'>> & { shouldRetry: (error: Error) => boolean } = {
  maxRetries: 5,
  initialDelay: 100, // shorter default to keep CLI responsive and tests fast
  multiplier: 2,
  maxDelay: 16000, // 16 seconds
  shouldRetry: () => true, // Retry all errors by default
};

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the operation
 * @throws Error from the last failed attempt
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const multiplier = options?.backoffMultiplier ?? options?.multiplier ?? DEFAULT_OPTIONS.multiplier;
  const opts = { ...DEFAULT_OPTIONS, ...options, multiplier };
  let lastError: Error | undefined;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if error should be retried
      if (!opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // Don't retry after the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Wait before next attempt
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * multiplier, opts.maxDelay);
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
