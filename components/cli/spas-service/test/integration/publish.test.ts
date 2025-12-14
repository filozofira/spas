import { PublishService } from '../../src/services/publish-service';
import { MetadataClient } from '../../src/services/metadata-client';
import { ArchiveReader } from '../../src/services/archive-reader';
import { RepositoryClient } from '../../src/services/repository-client';
import * as readline from 'readline';

jest.mock('../../src/services/metadata-client');
jest.mock('../../src/services/archive-reader');
jest.mock('../../src/services/repository-client');
jest.mock('readline');

describe('Publish Command Integration', () => {
    let mockMetadataClient: jest.Mocked<MetadataClient>;
    let mockArchiveReader: jest.Mocked<ArchiveReader>;
    let mockRepositoryClient: jest.Mocked<RepositoryClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockMetadataClient = new MetadataClient() as jest.Mocked<MetadataClient>;
        mockArchiveReader = new ArchiveReader() as jest.Mocked<ArchiveReader>;
        mockRepositoryClient = new RepositoryClient('http://localhost:3000') as jest.Mocked<RepositoryClient>;
    });

    describe('End-to-end publish workflow', () => {
        it('should complete full publish workflow successfully', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip');
            const identity = { id: 'test-service', version: '1.0.0' };

            mockMetadataClient.downloadMetadata.mockResolvedValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue();

            const publishService = new PublishService(
                mockMetadataClient,
                mockArchiveReader,
                mockRepositoryClient
            );

            // Act
            await publishService.publish(serviceHost);

            // Assert
            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledWith(serviceHost);
            expect(mockArchiveReader.extractIdentity).toHaveBeenCalledWith(archiveBuffer);
            expect(mockRepositoryClient.publishService).toHaveBeenCalledWith(
                identity.id,
                identity.version,
                archiveBuffer
            );
        });

        it('should handle user prompt before downloading metadata', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip');
            const identity = { id: 'test-service', version: '1.0.0' };

            mockMetadataClient.downloadMetadata.mockResolvedValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue();

            // Mock readline to simulate user pressing Enter
            const mockInterface = {
                question: jest.fn((query, callback) => callback()),
                close: jest.fn()
            };
            (readline.createInterface as jest.Mock).mockReturnValue(mockInterface);

            const publishService = new PublishService(
                mockMetadataClient,
                mockArchiveReader,
                mockRepositoryClient
            );

            // Act
            await publishService.publish(serviceHost);

            // Assert
            expect(mockInterface.question).toHaveBeenCalledWith(
                expect.stringContaining(serviceHost),
                expect.any(Function)
            );
            expect(mockInterface.close).toHaveBeenCalled();
        });

        it('should propagate errors from download phase', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const error = new Error('Service unavailable');
            (error as any).code = 'SERVICE_UNAVAILABLE';

            mockMetadataClient.downloadMetadata.mockRejectedValue(error);

            const publishService = new PublishService(
                mockMetadataClient,
                mockArchiveReader,
                mockRepositoryClient
            );

            // Act & Assert
            await expect(publishService.publish(serviceHost))
                .rejects
                .toThrow('Service unavailable');
        });

        it('should propagate errors from publish phase', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip');
            const identity = { id: 'test-service', version: '1.0.0' };
            const error = new Error('Version conflict');
            (error as any).code = 'VERSION_CONFLICT';

            mockMetadataClient.downloadMetadata.mockResolvedValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockRejectedValue(error);

            const publishService = new PublishService(
                mockMetadataClient,
                mockArchiveReader,
                mockRepositoryClient
            );

            // Act & Assert
            await expect(publishService.publish(serviceHost))
                .rejects
                .toThrow('Version conflict');
        });
    });

    describe('Dry-run mode', () => {
        it('should not call repository when dry-run is enabled', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip');
            const identity = { id: 'test-service', version: '1.0.0' };
            const schemas = ['schemas/endpoints/test.schema.json'];

            mockMetadataClient.downloadMetadata.mockResolvedValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockArchiveReader.listSchemas.mockReturnValue(schemas);

            const publishService = new PublishService(
                mockMetadataClient,
                mockArchiveReader,
                mockRepositoryClient
            );

            // Act
            const result = await publishService.publishDryRun(serviceHost);

            // Assert
            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledWith(serviceHost);
            expect(mockArchiveReader.extractIdentity).toHaveBeenCalledWith(archiveBuffer);
            expect(mockRepositoryClient.publishService).not.toHaveBeenCalled();
            expect(result.identity).toEqual(identity);
            expect(result.schemas).toEqual(schemas);
        });

        it('should save archive locally during dry-run', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip');
            const identity = { id: 'test-service', version: '1.0.0' };

            mockMetadataClient.downloadMetadata.mockResolvedValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockArchiveReader.listSchemas.mockReturnValue([]);

            const publishService = new PublishService(
                mockMetadataClient,
                mockArchiveReader,
                mockRepositoryClient
            );

            // Act
            const result = await publishService.publishDryRun(serviceHost);

            // Assert
            expect(result.savedPath).toContain('test-service-1.0.0.zip');
        });
    });
});
