import { retryWithBackoff } from '../../../src/utils/retry';

describe('Retry Utility', () => {
    describe('retryWithBackoff', () => {
        it('should succeed on first attempt without retry', async () => {
            // Arrange
            const operation = jest.fn().mockResolvedValue('success');

            // Act
            const result = await retryWithBackoff(operation);

            // Assert
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure and eventually succeed', async () => {
            // Arrange
            const operation = jest.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockResolvedValueOnce('success');

            // Act
            const result = await retryWithBackoff(operation);

            // Assert
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(3);
        });

        it('should implement exponential backoff timing', async () => {
            // Arrange
            jest.useFakeTimers();
            const operation = jest.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockResolvedValueOnce('success');

            // Act
            const promise = retryWithBackoff(operation, { 
                maxRetries: 5, 
                initialDelay: 1000,
                maxDelay: 16000,
                backoffMultiplier: 2
            });

            // Fast-forward through first retry (1000ms)
            await jest.advanceTimersByTimeAsync(1000);
            
            // Fast-forward through second retry (2000ms)
            await jest.advanceTimersByTimeAsync(2000);

            const result = await promise;

            // Assert
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(3);

            jest.useRealTimers();
        });

        it('should throw error after max retries exceeded', async () => {
            // Arrange
            const error = new Error('Persistent failure');
            const operation = jest.fn().mockRejectedValue(error);

            // Act & Assert
            await expect(
                retryWithBackoff(operation, { maxRetries: 3 })
            ).rejects.toThrow('Persistent failure');
            
            expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
        });

        it('should respect max delay cap', async () => {
            // Arrange
            jest.useFakeTimers();
            const operation = jest.fn()
                .mockRejectedValueOnce(new Error('Fail'))
                .mockRejectedValueOnce(new Error('Fail'))
                .mockRejectedValueOnce(new Error('Fail'))
                .mockRejectedValueOnce(new Error('Fail'))
                .mockResolvedValueOnce('success');

            // Act
            const promise = retryWithBackoff(operation, {
                maxRetries: 5,
                initialDelay: 1000,
                maxDelay: 8000, // Cap at 8s
                backoffMultiplier: 2
            });

            // Delays should be: 1s, 2s, 4s, 8s (capped), 8s (capped)
            await jest.advanceTimersByTimeAsync(1000);  // 1st retry
            await jest.advanceTimersByTimeAsync(2000);  // 2nd retry
            await jest.advanceTimersByTimeAsync(4000);  // 3rd retry
            await jest.advanceTimersByTimeAsync(8000);  // 4th retry (capped)

            const result = await promise;

            // Assert
            expect(result).toBe('success');

            jest.useRealTimers();
        });

        it('should not retry on non-retryable errors if specified', async () => {
            // Arrange
            const error = new Error('Non-retryable');
            (error as any).code = 'VALIDATION_ERROR';
            const operation = jest.fn().mockRejectedValue(error);
            const shouldRetry = (err: Error) => {
                return (err as any).code !== 'VALIDATION_ERROR';
            };

            // Act & Assert
            await expect(
                retryWithBackoff(operation, { maxRetries: 3, shouldRetry })
            ).rejects.toThrow('Non-retryable');
            
            expect(operation).toHaveBeenCalledTimes(1); // No retries
        });
    });
});
