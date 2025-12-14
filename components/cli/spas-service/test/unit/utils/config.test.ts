import { resolveRepositoryUrl } from '../../../src/utils/config';

describe('Config Utils', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        delete process.env.SPAS_REPOSITORY_URL;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('resolveRepositoryUrl', () => {
        it('should use --repo flag value when provided', () => {
            // Arrange
            const flagValue = 'http://custom-repo:8080';
            process.env.SPAS_REPOSITORY_URL = 'http://env-repo:3000';

            // Act
            const result = resolveRepositoryUrl(flagValue);

            // Assert
            expect(result).toBe('http://custom-repo:8080');
        });

        it('should use SPAS_REPOSITORY_URL env var when flag not provided', () => {
            // Arrange
            process.env.SPAS_REPOSITORY_URL = 'http://env-repo:3000';

            // Act
            const result = resolveRepositoryUrl(undefined);

            // Assert
            expect(result).toBe('http://env-repo:3000');
        });

        it('should use default localhost:3000 when neither flag nor env var provided', () => {
            // Arrange
            delete process.env.SPAS_REPOSITORY_URL;

            // Act
            const result = resolveRepositoryUrl(undefined);

            // Assert
            expect(result).toBe('http://localhost:3000');
        });

        it('should handle empty string flag as undefined', () => {
            // Arrange
            process.env.SPAS_REPOSITORY_URL = 'http://env-repo:3000';

            // Act
            const result = resolveRepositoryUrl('');

            // Assert
            expect(result).toBe('http://env-repo:3000');
        });

        it('should trim whitespace from URL values', () => {
            // Arrange
            const flagValue = '  http://custom-repo:8080  ';

            // Act
            const result = resolveRepositoryUrl(flagValue);

            // Assert
            expect(result).toBe('http://custom-repo:8080');
        });
    });
});
