type RetryableFunction<T> = () => Promise<T>;

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const BACKOFF_MULTIPLIER = 2;

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('fetch failed') ||
      message.includes('econnreset') ||
      message.includes('network') ||
      message.includes('neon') ||
      message.includes('connect')
    );
  }
  return false;
}

export async function withRetry<T>(
  fn: RetryableFunction<T>,
  options: { maxRetries?: number; initialDelayMs?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const initialDelayMs = options.initialDelayMs ?? INITIAL_DELAY_MS;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      const delayMs = initialDelayMs * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
