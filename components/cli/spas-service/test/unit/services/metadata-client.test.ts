import { MetadataClient } from '../../../src/services/metadata-client';
import axios from 'axios';
import { ErrorCode } from '../../../src/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MetadataClient', () => {
    let metadataClient: MetadataClient;

    beforeEach(() => {
        metadataClient = new MetadataClient();
        jest.clearAllMocks();
    });

    describe('downloadMetadata', () => {
        it('should successfully download metadata from service', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const mockBuffer = Buffer.from('mock-zip-content');
            mockedAxios.get.mockResolvedValueOnce({
                data: mockBuffer,
                status: 200,
                statusText: 'OK',
                headers: { 'content-type': 'application/zip' },
                config: {}
            });

            // Act
            const result = await metadataClient.downloadMetadata(serviceHost);

            // Assert
            expect(result).toEqual(mockBuffer);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                `${serviceHost}/_spas/metadata`,
                expect.objectContaining({
                    responseType: 'arraybuffer'
                })
            );
        });

        it('should throw SERVICE_UNAVAILABLE error on 404', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            mockedAxios.get.mockRejectedValueOnce({
                response: { status: 404 }
            });

            // Act & Assert
            await expect(metadataClient.downloadMetadata(serviceHost))
                .rejects
                .toMatchObject({
                    code: ErrorCode.SERVICE_UNAVAILABLE,
                    message: expect.stringContaining('404')
                });
        });

        it('should retry on timeout and eventually succeed', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            const mockBuffer = Buffer.from('mock-zip-content');
            
            // First call fails with timeout
            mockedAxios.get
                .mockRejectedValueOnce({ code: 'ECONNABORTED' })
                .mockResolvedValueOnce({
                    data: mockBuffer,
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {}
                });

            // Act
            const result = await metadataClient.downloadMetadata(serviceHost);

            // Assert
            expect(result).toEqual(mockBuffer);
            expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        });

        it('should fail after max retries exceeded', async () => {
            // Arrange
            const serviceHost = 'http://localhost:5000';
            mockedAxios.get.mockRejectedValue({ code: 'ECONNABORTED' });

            // Act & Assert
            await expect(metadataClient.downloadMetadata(serviceHost))
                .rejects
                .toMatchObject({
                    code: ErrorCode.SERVICE_UNAVAILABLE
                });
            
            expect(mockedAxios.get).toHaveBeenCalledTimes(6); // Initial + 5 retries
        });
    });
});
