import { RepositoryClient } from '../../../src/services/repository-client';
import FormData from 'form-data';
import axios from 'axios';
import { ErrorCode } from '../../../src/types';

jest.mock('axios');
jest.mock('form-data');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RepositoryClient', () => {
    let repositoryClient: RepositoryClient;
    const repoUrl = 'http://localhost:3000';

    beforeEach(() => {
        repositoryClient = new RepositoryClient(repoUrl);
        jest.clearAllMocks();
    });

    describe('publishService', () => {
        it('should successfully publish service and return 201 Created', async () => {
            // Arrange
            const serviceId = 'test-service';
            const version = '1.0.0';
            const archiveBuffer = Buffer.from('mock-zip');
            
            mockedAxios.post.mockResolvedValueOnce({
                status: 201,
                statusText: 'Created',
                data: { message: 'Service published successfully' },
                headers: {},
                config: {}
            });

            // Act
            await repositoryClient.publishService(serviceId, version, archiveBuffer);

            // Assert
            expect(mockedAxios.post).toHaveBeenCalledWith(
                `${repoUrl}/services/${serviceId}:${version}`,
                expect.any(FormData),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': expect.stringContaining('multipart/form-data')
                    })
                })
            );
        });

        it('should throw VALIDATION_ERROR on 400 Bad Request', async () => {
            // Arrange
            const serviceId = 'test-service';
            const version = '1.0.0';
            const archiveBuffer = Buffer.from('mock-zip');
            
            mockedAxios.post.mockRejectedValueOnce({
                response: {
                    status: 400,
                    data: { error: 'Invalid schema' }
                }
            });

            // Act & Assert
            await expect(
                repositoryClient.publishService(serviceId, version, archiveBuffer)
            ).rejects.toMatchObject({
                code: ErrorCode.VALIDATION_ERROR,
                message: expect.stringContaining('400')
            });
        });

        it('should throw VERSION_CONFLICT on 409 Conflict', async () => {
            // Arrange
            const serviceId = 'test-service';
            const version = '1.0.0';
            const archiveBuffer = Buffer.from('mock-zip');
            
            mockedAxios.post.mockRejectedValueOnce({
                response: {
                    status: 409,
                    data: { error: 'Version already exists' }
                }
            });

            // Act & Assert
            await expect(
                repositoryClient.publishService(serviceId, version, archiveBuffer)
            ).rejects.toMatchObject({
                code: ErrorCode.VERSION_CONFLICT,
                message: expect.stringContaining('409')
            });
        });

        it('should throw REPOSITORY_UNREACHABLE on network error', async () => {
            // Arrange
            const serviceId = 'test-service';
            const version = '1.0.0';
            const archiveBuffer = Buffer.from('mock-zip');
            
            mockedAxios.post.mockRejectedValueOnce({
                code: 'ECONNREFUSED'
            });

            // Act & Assert
            await expect(
                repositoryClient.publishService(serviceId, version, archiveBuffer)
            ).rejects.toMatchObject({
                code: ErrorCode.REPOSITORY_UNREACHABLE
            });
        });
    });

    describe('downloadService', () => {
        it('should successfully download service metadata', async () => {
            // Arrange
            const serviceId = 'test-service';
            const version = '1.0.0';
            const mockBuffer = Buffer.from('mock-zip-content');
            
            mockedAxios.get.mockResolvedValueOnce({
                data: mockBuffer,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            });

            // Act
            const result = await repositoryClient.downloadService(serviceId, version);

            // Assert
            expect(result).toEqual(mockBuffer);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                `${repoUrl}/services/${serviceId}/versions/${version}/download`,
                expect.objectContaining({
                    responseType: 'arraybuffer'
                })
            );
        });

        it('should throw NOT_FOUND on 404', async () => {
            // Arrange
            const serviceId = 'nonexistent-service';
            const version = '1.0.0';
            
            mockedAxios.get.mockRejectedValueOnce({
                response: { status: 404 }
            });

            // Act & Assert
            await expect(
                repositoryClient.downloadService(serviceId, version)
            ).rejects.toMatchObject({
                code: ErrorCode.NOT_FOUND
            });
        });
    });
});
