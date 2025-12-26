import { resolveRepositoryUrl, isValidServiceName, resolveWorkspacePath } from '../../../src/utils/config';

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

    describe('isValidServiceName', () => {
        it('should accept valid kebab-case names', () => {
            expect(isValidServiceName('order-service')).toBe(true);
            expect(isValidServiceName('inventory-service')).toBe(true);
            expect(isValidServiceName('my-service-v2')).toBe(true);
        });

        it('should accept single word names', () => {
            expect(isValidServiceName('order')).toBe(true);
            expect(isValidServiceName('a')).toBe(true);
            expect(isValidServiceName('ab1')).toBe(true);
        });

        it('should reject names with uppercase letters', () => {
            expect(isValidServiceName('Order-Service')).toBe(false);
            expect(isValidServiceName('orderService')).toBe(false);
            expect(isValidServiceName('ORDER')).toBe(false);
        });

        it('should reject names with underscores', () => {
            expect(isValidServiceName('my_service')).toBe(false);
            expect(isValidServiceName('order_service')).toBe(false);
        });

        it('should reject names starting with a number', () => {
            expect(isValidServiceName('2service')).toBe(false);
            expect(isValidServiceName('123')).toBe(false);
        });

        it('should reject names ending with a hyphen', () => {
            expect(isValidServiceName('service-')).toBe(false);
        });

        it('should reject names with double hyphens', () => {
            expect(isValidServiceName('my--service')).toBe(false);
        });

        it('should reject names with spaces', () => {
            expect(isValidServiceName('my service')).toBe(false);
        });

        it('should reject empty or null values', () => {
            expect(isValidServiceName('')).toBe(false);
            expect(isValidServiceName(null as unknown as string)).toBe(false);
            expect(isValidServiceName(undefined as unknown as string)).toBe(false);
        });
    });

    describe('resolveWorkspacePath', () => {
        it('should append service name to current directory when no output specified', () => {
            const result = resolveWorkspacePath('order-service');
            expect(result).toContain('order-service');
            expect(result.endsWith('order-service')).toBe(true);
        });

        it('should use custom output directory when specified', () => {
            const result = resolveWorkspacePath('order-service', '/custom/path');
            expect(result).toContain('order-service');
            expect(result).toContain('custom');
        });
    });
});
