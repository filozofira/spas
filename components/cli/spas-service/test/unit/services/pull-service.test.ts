import { PullService } from '../../../src/services/pull-service';
import { RepositoryClient } from '../../../src/services/repository-client';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('../../../src/services/repository-client');
jest.mock('fs');

describe('PullService', () => {
    let mockRepositoryClient: jest.Mocked<RepositoryClient>;
    let pullService: PullService;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockRepositoryClient = new RepositoryClient('http://localhost:3000') as jest.Mocked<RepositoryClient>;
        pullService = new PullService(mockRepositoryClient);
    });

    describe('pull', () => {
        it('should download service metadata and save to file', async () => {
            // Arrange
            const serviceName = 'order-service';
            const version = '1.0.0';
            const archiveBuffer = Buffer.from('mock-zip-content');

            mockRepositoryClient.downloadService.mockResolvedValue(archiveBuffer);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            // Act
            const result = await pullService.pull(serviceName, version);

            // Assert
            expect(mockRepositoryClient.downloadService).toHaveBeenCalledWith(serviceName, version);
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('order-service-1.0.0.zip'),
                archiveBuffer
            );
            expect(result.serviceName).toBe(serviceName);
            expect(result.version).toBe(version);
            expect(result.savedPath).toContain('order-service-1.0.0.zip');
        });

        it('should use custom output directory when specified', async () => {
            // Arrange
            const serviceName = 'order-service';
            const version = '1.0.0';
            const outputDir = './custom-output';
            const archiveBuffer = Buffer.from('mock-zip-content');

            mockRepositoryClient.downloadService.mockResolvedValue(archiveBuffer);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            // Act
            const result = await pullService.pull(serviceName, version, outputDir);

            // Assert
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining(path.join(outputDir, 'order-service-1.0.0.zip')),
                archiveBuffer
            );
            expect(result.savedPath).toContain('order-service-1.0.0.zip');
            expect(result.savedPath).toContain('custom-output');
        });

        it('should propagate NOT_FOUND error from repository client', async () => {
            // Arrange
            const serviceName = 'nonexistent-service';
            const version = '1.0.0';
            const error = new Error('Service version not found');
            (error as any).code = 'NOT_FOUND';

            mockRepositoryClient.downloadService.mockRejectedValue(error);

            // Act & Assert
            await expect(pullService.pull(serviceName, version))
                .rejects.toMatchObject({
                    code: 'NOT_FOUND'
                });
        });

        it('should return download result with correct properties', async () => {
            // Arrange
            const serviceName = 'my-service';
            const version = '2.0.0';
            const archiveBuffer = Buffer.from('test-content');

            mockRepositoryClient.downloadService.mockResolvedValue(archiveBuffer);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            // Act
            const result = await pullService.pull(serviceName, version);

            // Assert
            expect(result).toEqual({
                serviceName: 'my-service',
                version: '2.0.0',
                savedPath: expect.stringContaining('my-service-2.0.0.zip'),
                bytes: archiveBuffer.length
            });
        });
    });
});
