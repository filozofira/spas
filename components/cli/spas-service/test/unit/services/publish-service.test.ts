import { PublishService } from '../../../src/services/publish-service';
import { ArchiveReader } from '../../../src/services/archive-reader';
import { RepositoryClient } from '../../../src/services/repository-client';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('../../../src/services/archive-reader');
jest.mock('../../../src/services/repository-client');
jest.mock('fs');

describe('PublishService', () => {
    let mockArchiveReader: jest.Mocked<ArchiveReader>;
    let mockRepositoryClient: jest.Mocked<RepositoryClient>;
    let publishService: PublishService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockArchiveReader = new ArchiveReader() as jest.Mocked<ArchiveReader>;
        mockRepositoryClient = new RepositoryClient('http://localhost:3000') as jest.Mocked<RepositoryClient>;
        
        publishService = new PublishService(
            mockArchiveReader,
            mockRepositoryClient
        );
    });

    describe('dryRunFromArchive', () => {
        it('should read local archive, list schemas, and save a normalized copy without publishing', async () => {
            const archivePath = './my-service-1.0.0.zip';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'my-service', version: '1.0.0' };
            const schemas = ['schemas/endpoints/create.schema.json', 'schemas/events/created.schema.json'];
            const outputDir = './out';

            (fs.readFileSync as jest.Mock).mockReturnValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockArchiveReader.listSchemas.mockReturnValue(schemas);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            const result = await publishService.dryRunFromArchive(archivePath, outputDir);

            expect(fs.readFileSync).toHaveBeenCalledWith(archivePath);
            expect(mockArchiveReader.extractIdentity).toHaveBeenCalledWith(archiveBuffer);
            expect(mockArchiveReader.listSchemas).toHaveBeenCalledWith(archiveBuffer);
            expect(mockRepositoryClient.publishService).not.toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                path.join(outputDir, 'my-service-1.0.0.zip'),
                archiveBuffer
            );
            expect(result.identity).toEqual(identity);
            expect(result.schemas).toEqual(schemas);
            expect(result.savedPath).toBe(path.join(outputDir, 'my-service-1.0.0.zip'));
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

