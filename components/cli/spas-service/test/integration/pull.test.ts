import { PullService } from '../../src/services/pull-service';
import { RepositoryClient } from '../../src/services/repository-client';
import * as fs from 'fs';

jest.mock('../../src/services/repository-client');
jest.mock('fs');

describe('Pull Command Integration', () => {
    let mockRepositoryClient: jest.Mocked<RepositoryClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRepositoryClient = new RepositoryClient('http://localhost:3000') as jest.Mocked<RepositoryClient>;
    });

    describe('End-to-end pull workflow', () => {
        it('should complete full pull workflow successfully', async () => {
            // Arrange
            const serviceName = 'order-service';
            const version = '1.0.0';
            const archiveBuffer = Buffer.from('mock-zip-content');

            mockRepositoryClient.downloadService.mockResolvedValue(archiveBuffer);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            const pullService = new PullService(mockRepositoryClient);

            // Act
            const result = await pullService.pull(serviceName, version);

            // Assert
            expect(mockRepositoryClient.downloadService).toHaveBeenCalledWith(serviceName, version);
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(result.serviceName).toBe(serviceName);
            expect(result.version).toBe(version);
        });

        it('should handle custom output directory', async () => {
            // Arrange
            const serviceName = 'order-service';
            const version = '1.0.0';
            const outputDir = './downloads';
            const archiveBuffer = Buffer.from('mock-zip-content');

            mockRepositoryClient.downloadService.mockResolvedValue(archiveBuffer);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            const pullService = new PullService(mockRepositoryClient);

            // Act
            const result = await pullService.pull(serviceName, version, outputDir);

            // Assert
            expect(result.savedPath).toContain('order-service-1.0.0.zip');
            expect(result.savedPath).toContain('downloads');
        });

        it('should propagate errors from repository client', async () => {
            // Arrange
            const serviceName = 'nonexistent-service';
            const version = '1.0.0';
            const error = new Error('Service not found');
            (error as any).code = 'NOT_FOUND';

            mockRepositoryClient.downloadService.mockRejectedValue(error);

            const pullService = new PullService(mockRepositoryClient);

            // Act & Assert
            await expect(pullService.pull(serviceName, version))
                .rejects.toThrow('Service not found');
        });
    });
});
