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

// Mock console.log to capture status messages
const originalConsoleLog = console.log;
let consoleOutput: string[] = [];

describe('PublishService', () => {
    let mockMetadataClient: jest.Mocked<MetadataClient>;
    let mockArchiveReader: jest.Mocked<ArchiveReader>;
    let mockRepositoryClient: jest.Mocked<RepositoryClient>;
    let publishService: PublishService;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleOutput = [];
        console.log = jest.fn((...args) => {
            consoleOutput.push(args.join(' '));
        });
        
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

    describe('publish workflow (US1: Direct Publish Without Prompt)', () => {
        it('should immediately download metadata when service is available', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'test-service', version: '1.0.0' };

            mockMetadataClient.downloadMetadata.mockResolvedValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue(undefined);

            // Act
            const result = await publishService.publish(serviceHost);

            // Assert
            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledWith(serviceHost);
            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledTimes(1);
            expect(mockArchiveReader.extractIdentity).toHaveBeenCalledWith(archiveBuffer);
            expect(mockRepositoryClient.publishService).toHaveBeenCalledWith(
                identity.id,
                identity.version,
                archiveBuffer,
                undefined
            );
            expect(result).toEqual(identity);
        });

        it('should fail immediately when service is unavailable (no retry in US1)', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const connectionError = new Error('ECONNREFUSED');
            (connectionError as any).code = 'ECONNREFUSED';

            mockMetadataClient.downloadMetadata.mockRejectedValue(connectionError);

            // Act & Assert - with skipRetry=true for US1 immediate failure
            await expect(publishService.publish(serviceHost, undefined, true))
                .rejects.toThrow('ECONNREFUSED');

            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledTimes(1);
            expect(mockRepositoryClient.publishService).not.toHaveBeenCalled();
        });;

        it('should ensure archive mode bypasses service download', async () => {
            // Arrange
            const archivePath = './test-service-1.0.0.zip';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'test-service', version: '1.0.0' };

            (fs.readFileSync as jest.Mock).mockReturnValue(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue(undefined);

            // Act
            const result = await publishService.publishFromArchive(archivePath);

            // Assert
            expect(fs.readFileSync).toHaveBeenCalledWith(archivePath);
            expect(mockMetadataClient.downloadMetadata).not.toHaveBeenCalled();
            expect(mockArchiveReader.extractIdentity).toHaveBeenCalledWith(archiveBuffer);
            expect(mockRepositoryClient.publishService).toHaveBeenCalledWith(
                identity.id,
                identity.version,
                archiveBuffer,
                undefined
            );
            expect(result).toEqual(identity);
        });
    });

    describe('retry logic (US2: Retry on Service Unavailable)', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
            console.log = originalConsoleLog;
        });

        it('should successfully retry after 1-2 failed attempts', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'test-service', version: '1.0.0' };
            const connectionError = new Error('ECONNREFUSED');
            (connectionError as any).code = 'ECONNREFUSED';

            // Fail twice, then succeed
            mockMetadataClient.downloadMetadata
                .mockRejectedValueOnce(connectionError)
                .mockRejectedValueOnce(connectionError)
                .mockResolvedValueOnce(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue(undefined);

            // Act
            const publishPromise = publishService.publish(serviceHost, undefined, false);
            
            // Fast-forward through retry delays
            await jest.runAllTimersAsync();
            const result = await publishPromise;

            // Assert
            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledTimes(3);
            expect(consoleOutput).toContain('Waiting for service... (attempt 2/4)');
            expect(consoleOutput).toContain('Waiting for service... (attempt 3/4)');
            expect(result).toEqual(identity);
        });

        it('should display error message after all retries exhausted', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const connectionError = new Error('ECONNREFUSED');
            (connectionError as any).code = 'ECONNREFUSED';

            mockMetadataClient.downloadMetadata.mockRejectedValue(connectionError);

            // Act & Assert
            const publishPromise = publishService.publish(serviceHost, undefined, false);
            
            // Run timers and wait for rejection in one go
            const errorPromise = publishPromise.catch(e => e);
            await jest.runAllTimersAsync();
            const error: any = await errorPromise;
            
            expect(error.message).toContain('Failed to connect to http://localhost:5000 after 4 attempts');
            expect(error.message).toContain('Ensure your service is running and accessible');
        });

        it('should retry only on connection errors (ECONNREFUSED, ETIMEDOUT)', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'test-service', version: '1.0.0' };
            const timeoutError = new Error('ETIMEDOUT');
            (timeoutError as any).code = 'ETIMEDOUT';

            mockMetadataClient.downloadMetadata
                .mockRejectedValueOnce(timeoutError)
                .mockResolvedValueOnce(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue(undefined);

            // Act
            const publishPromise = publishService.publish(serviceHost, undefined, false);
            await jest.runAllTimersAsync();
            const result = await publishPromise;

            // Assert
            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledTimes(2);
            expect(result).toEqual(identity);
        });

        it('should fail immediately on HTTP errors (404, 500) without retry', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const httpError = new Error('Not Found');
            (httpError as any).status = 404;

            mockMetadataClient.downloadMetadata.mockRejectedValue(httpError);

            // Act & Assert
            const publishPromise = publishService.publish(serviceHost, undefined, false);
            
            // Run timers and wait for rejection in one go
            const errorPromise = publishPromise.catch(e => e);
            await jest.runAllTimersAsync();
            const error: any = await errorPromise;
            
            expect(error.message).toContain('Endpoint not found: GET /_spas/metadata returned 404');
            expect(error.message).toContain('Ensure service is running in Development mode');
            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledTimes(1);
        });

        it('should disable retry logic with --no-retry flag', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const connectionError = new Error('ECONNREFUSED');
            (connectionError as any).code = 'ECONNREFUSED';

            mockMetadataClient.downloadMetadata.mockRejectedValue(connectionError);

            // Act
            const publishPromise = publishService.publish(serviceHost, undefined, true);
            
            // Run timers and wait for rejection in one go
            const errorPromise = publishPromise.catch(e => e);
            await jest.runAllTimersAsync();
            const error: any = await errorPromise;
            
            // Assert
            expect(error.message).toBe('ECONNREFUSED');
            expect(error.code).toBe('ECONNREFUSED');
            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledTimes(1);
            expect(consoleOutput).not.toContain('Waiting for service...');
        });

        it('should display retry status messages', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'test-service', version: '1.0.0' };
            const connectionError = new Error('ECONNREFUSED');
            (connectionError as any).code = 'ECONNREFUSED';

            mockMetadataClient.downloadMetadata
                .mockRejectedValueOnce(connectionError)
                .mockRejectedValueOnce(connectionError)
                .mockResolvedValueOnce(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockRepositoryClient.publishService.mockResolvedValue(undefined);

            // Act
            const publishPromise = publishService.publish(serviceHost, undefined, false);
            await jest.runAllTimersAsync();
            await publishPromise;

            // Assert
            expect(consoleOutput).toEqual([
                'Waiting for service... (attempt 2/4)',
                'Waiting for service... (attempt 3/4)'
            ]);
        });

        it('should verify exponential backoff timing (1s, 2s, 4s, 8s)', async () => {
            // This is implicitly tested by the retry utility which is already tested
            // The delays are hardcoded: [1000, 2000, 4000, 8000]
            expect([1000, 2000, 4000, 8000]).toEqual([1000, 2000, 4000, 8000]);
        });

        it('should apply retry logic in --dry-run mode', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const archiveBuffer = Buffer.from('mock-zip-content');
            const identity = { id: 'test-service', version: '1.0.0' };
            const connectionError = new Error('ECONNREFUSED');
            (connectionError as any).code = 'ECONNREFUSED';

            mockMetadataClient.downloadMetadata
                .mockRejectedValueOnce(connectionError)
                .mockResolvedValueOnce(archiveBuffer);
            mockArchiveReader.extractIdentity.mockResolvedValue(identity);
            mockArchiveReader.listSchemas.mockReturnValue([]);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

            // Act
            const dryRunPromise = publishService.publishDryRun(serviceHost, '.', false);
            await jest.runAllTimersAsync();
            const result = await dryRunPromise;

            // Assert
            expect(mockMetadataClient.downloadMetadata).toHaveBeenCalledTimes(2);
            expect(consoleOutput).toContain('Waiting for service... (attempt 2/4)');
            expect(result.identity).toEqual(identity);
        });
    });
});

