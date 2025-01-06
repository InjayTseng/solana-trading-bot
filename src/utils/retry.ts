import logger from './logger';

interface RetryOptions {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    jitter?: boolean;
}

export async function withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 5,
        initialDelay = 500,
        maxDelay = 10000,
        factor = 2,
        jitter = true
    } = options;

    let attempt = 1;
    let delay = initialDelay;

    while (true) {
        try {
            return await operation();
        } catch (error: any) {
            if (attempt >= maxAttempts) {
                throw error;
            }

            // Check if we should retry based on error type
            if (error.response?.status === 429 || // Rate limit
                error.response?.status >= 500 || // Server errors
                error.code === 'ECONNRESET' || // Connection reset
                error.code === 'ETIMEDOUT') { // Timeout
                
                // Calculate next delay with exponential backoff
                const nextDelay = Math.min(delay * factor, maxDelay);
                
                // Add jitter if enabled (±25% of delay)
                const actualDelay = jitter
                    ? nextDelay * (0.75 + Math.random() * 0.5)
                    : nextDelay;

                logger.warn(
                    `Request failed. Retrying in ${Math.round(actualDelay)}ms (attempt ${attempt}/${maxAttempts})`,
                    {
                        error: error.message,
                        status: error.response?.status,
                        attempt,
                        delay: Math.round(actualDelay)
                    }
                );

                await new Promise(resolve => setTimeout(resolve, actualDelay));
                delay = nextDelay;
                attempt++;
                continue;
            }

            // If error is not retryable, throw immediately
            throw error;
        }
    }
}
