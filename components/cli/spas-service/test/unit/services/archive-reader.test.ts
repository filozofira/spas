import { ArchiveReader } from '../../../src/services/archive-reader';
import AdmZip from 'adm-zip';
import { ErrorCode } from '../../../src/types';

describe('ArchiveReader', () => {
    let archiveReader: ArchiveReader;

    beforeEach(() => {
        archiveReader = new ArchiveReader();
    });

    describe('extractIdentity', () => {
        it('should extract service identity from valid ZIP with spas.json', async () => {
            // Arrange
            const zip = new AdmZip();
            const spasJson = {
                id: 'test-service',
                name: 'Test Service',
                version: '1.0.0'
            };
            zip.addFile('spas.json', Buffer.from(JSON.stringify(spasJson)));
            const buffer = zip.toBuffer();

            // Act
            const identity = await archiveReader.extractIdentity(buffer);

            // Assert
            expect(identity.id).toBe('test-service');
            expect(identity.version).toBe('1.0.0');
        });

        it('should throw error when spas.json is missing', async () => {
            // Arrange
            const zip = new AdmZip();
            zip.addFile('other-file.txt', Buffer.from('content'));
            const buffer = zip.toBuffer();

            // Act & Assert
            await expect(archiveReader.extractIdentity(buffer))
                .rejects
                .toMatchObject({
                    code: ErrorCode.ARCHIVE_INVALID,
                    message: expect.stringContaining('spas.json')
                });
        });

        it('should throw error when spas.json contains malformed JSON', async () => {
            // Arrange
            const zip = new AdmZip();
            zip.addFile('spas.json', Buffer.from('{ invalid json }'));
            const buffer = zip.toBuffer();

            // Act & Assert
            await expect(archiveReader.extractIdentity(buffer))
                .rejects
                .toMatchObject({
                    code: ErrorCode.ARCHIVE_INVALID,
                    message: expect.stringContaining('JSON')
                });
        });

        it('should throw error when spas.json is missing required fields', async () => {
            // Arrange
            const zip = new AdmZip();
            const incompleteJson = { id: 'test-service' }; // Missing version
            zip.addFile('spas.json', Buffer.from(JSON.stringify(incompleteJson)));
            const buffer = zip.toBuffer();

            // Act & Assert
            await expect(archiveReader.extractIdentity(buffer))
                .rejects
                .toMatchObject({
                    code: ErrorCode.ARCHIVE_INVALID,
                    message: expect.stringContaining('version')
                });
        });
    });
});
