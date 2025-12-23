import { PublishService } from '../../../src/services/publish-service';
import { MetadataClient } from '../../../src/services/metadata-client';
import { ArchiveReader } from '../../../src/services/archive-reader';
import { RepositoryClient } from '../../../src/services/repository-client';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('../../../src/services/metadata-client');
jest.mock('../../../src/services/archive-reader');
jest.mock('../../../src/services/repository-client');
jest.mock('fs');

describe('PublishService', () => {
    let mockMetadataClient: jest.Mocked<MetadataClient>;
    let mockArchiveReader: jest.Mocked<ArchiveReader>;
    let mockRepositoryClient: jest.Mocked<RepositoryClient>;
    let publishService: PublishService;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockMetadataClient = new MetadataClient() as jest.Mocked<MetadataClient>;
        mockArchiveReader = new ArchiveReader() as jest.Mocked<ArchiveReader>;
        mockRepositoryClient = new RepositoryClient('http://localhost:3000') as jest.Mocked<RepositoryClient>;
        
        publishService = new PublishService(
            mockMetadataClient,
            mockArchiveReader,
            mockRepositoryClient
        );
    });

    describe('dry-run mode', () => {
        it('should save archive to local file and skip repository publish', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'test-service', version: '1.0.0' };
            const schemas = ['schemas/endpoints/create.schema.json', 'schemas/events/created.schema.json'];

            mockMetadataClient.downloadMetadata.mockResolvedValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockArchiveReader.listSchemas.mockReturnValue(schemas);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            // Act
            const result = await publishService.publishDryRun(serviceHost);

            // Assert
            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledWith(serviceHost);
            expect(mockArchiveReader.extractIdentity).toHaveBeenCalledWith(archiveBuffer);
            expect(mockRepositoryClient.publishService).not.toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('test-service-1.0.0.zip'),
                archiveBuffer
            );
            expect(result.identity).toEqual(identity);
            expect(result.savedPath).toContain('test-service-1.0.0.zip');
            expect(result.schemas).toEqual(schemas);
        });

        it('should return archive contents summary', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'my-service', name: 'My Service', version: '2.1.0' };
            const schemas = [
                'schemas/endpoints/endpoint1.schema.json',
                'schemas/endpoints/endpoint2.schema.json',
                'schemas/events/event1.schema.json'
            ];

            mockMetadataClient.downloadMetadata.mockResolvedValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockArchiveReader.listSchemas.mockReturnValue(schemas);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            // Act
            const result = await publishService.publishDryRun(serviceHost);

            // Assert
            expect(result.identity.id).toBe('my-service');
            expect(result.identity.version).toBe('2.1.0');
            expect(result.schemas).toHaveLength(3);
        });

        it('should use custom output directory when specified', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'test-service', version: '1.0.0' };
            const outputDir = './custom-output';

            mockMetadataClient.downloadMetadata.mockResolvedValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockArchiveReader.listSchemas.mockReturnValue([]);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            // Act
            const result = await publishService.publishDryRun(serviceHost, outputDir);

            // Assert
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining(path.join(outputDir, 'test-service-1.0.0.zip')),
                archiveBuffer
            );
        });
    });

    describe('archive mode', () => {
        it('should read local ZIP file and publish to repository', async () => {
            // Arrange
            const archivePath = './my-service-1.0.0.zip';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'my-service', version: '1.0.0' };

            (fs.readFileSync as jest.Mock).mockReturnValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue(undefined);

            // Act
            const result = await publishService.publishFromArchive(archivePath);

            // Assert
            expect(fs.readFileSync).toHaveBeenCalledWith(archivePath);
            expect(mockArchiveReader.extractIdentity).toHaveBeenCalledWith(archiveBuffer);
            expect(mockRepositoryClient.publishService).toHaveBeenCalledWith(
                identity.id,
                identity.version,
                archiveBuffer,
                undefined
            );
            expect(mockMetadataClient.downloadMetadata).not.toHaveBeenCalled();
            expect(result).toEqual(identity);
        });

        it('should validate spas.json exists in archive', async () => {
            // Arrange
            const archivePath = './invalid-archive.zip';
            const archiveBuffer = Buffer.from('invalid-zip-content');

            (fs.readFileSync as jest.Mock).mockReturnValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockRejectedValue(
                new Error('Archive does not contain spas.json')
            );

            // Act & Assert
            await expect(publishService.publishFromArchive(archivePath))
                .rejects.toThrow('Archive does not contain spas.json');
        });

        it('should pass runtime metadata to repository client when provided', async () => {
            // Arrange
            const archivePath = './my-service-1.0.0.zip';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'my-service', version: '1.0.0' };
            const runtimeMetadata = {
                imageDigest: 'sha256:abc123def456',
                imageRepository: 'ghcr.io/myorg/my-service',
                imageTag: '1.0.0'
            };

            (fs.readFileSync as jest.Mock).mockReturnValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue(undefined);

            // Act
            const result = await publishService.publishFromArchive(archivePath, runtimeMetadata);

            // Assert
            expect(mockRepositoryClient.publishService).toHaveBeenCalledWith(
                identity.id,
                identity.version,
                archiveBuffer,
                runtimeMetadata
            );
        });
    });
});
