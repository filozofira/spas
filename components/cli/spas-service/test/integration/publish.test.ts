import { PublishService } from '../../src/services/publish-service';
import { ArchiveReader } from '../../src/services/archive-reader';
import { RepositoryClient } from '../../src/services/repository-client';
import * as fs from 'fs';

jest.mock('../../src/services/archive-reader');
jest.mock('../../src/services/repository-client');
jest.mock('fs');

describe('Publish Command Integration', () => {
    let mockArchiveReader: jest.Mocked<ArchiveReader>;
    let mockRepositoryClient: jest.Mocked<RepositoryClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockArchiveReader = new ArchiveReader() as jest.Mocked<ArchiveReader>;
        mockRepositoryClient = new RepositoryClient('http://localhost:3000') as jest.Mocked<RepositoryClient>;
    });

    describe('Dry-run mode', () => {
        it('should not call repository when dry-run is enabled (archive input)', async () => {
            const archivePath = './my-service-1.0.0.zip';
            const archiveBuffer = Buffer.from('mock-zip');
            const identity = { id: 'my-service', version: '1.0.0' };
            const schemas = ['schemas/endpoints/test.schema.json'];

            (fs.readFileSync as jest.Mock).mockReturnValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockArchiveReader.listSchemas.mockReturnValue(schemas);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            const publishService = new PublishService(
                mockArchiveReader,
                mockRepositoryClient
            );

            const result = await publishService.dryRunFromArchive(archivePath);

            expect(fs.readFileSync).toHaveBeenCalledWith(archivePath);
            expect(mockRepositoryClient.publishService).not.toHaveBeenCalled();
            expect(result.identity).toEqual(identity);
            expect(result.schemas).toEqual(schemas);
        });
    });

    describe('Archive mode', () => {
        it('should publish from local archive file without prompting user', async () => {
            // Arrange
            const archivePath = './my-service-1.0.0.zip';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'my-service', version: '1.0.0' };

            (fs.readFileSync as jest.Mock).mockReturnValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue(undefined);

            const publishService = new PublishService(mockArchiveReader, mockRepositoryClient);

            // Act
            const result = await publishService.publishFromArchive(archivePath);

            // Assert
            expect(mockRepositoryClient.publishService).toHaveBeenCalledWith(
                identity.id,
                identity.version,
                archiveBuffer,
                undefined
            );
            expect(result).toEqual(identity);
        });

        it('should publish with runtime metadata when provided', async () => {
            // Arrange
            const archivePath = './my-service-1.0.0.zip';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'my-service', version: '1.0.0' };
            const runtimeMetadata = {
                imageDigest: 'sha256:abc123',
                imageRepository: 'ghcr.io/myorg/my-service',
                imageTag: '1.0.0'
            };

            (fs.readFileSync as jest.Mock).mockReturnValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue(undefined);

            const publishService = new PublishService(mockArchiveReader, mockRepositoryClient);

            // Act
            await publishService.publishFromArchive(archivePath, runtimeMetadata);

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
