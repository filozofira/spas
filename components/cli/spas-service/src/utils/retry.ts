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
  /** Maximum delay in milliseconds */
  maxDelay?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  multiplier: 2,
  maxDelay: 16000, // 16 seconds
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
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry after the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Wait before next attempt
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * opts.multiplier, opts.maxDelay);
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
