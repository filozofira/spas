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
jest.mock('readline');

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
});
