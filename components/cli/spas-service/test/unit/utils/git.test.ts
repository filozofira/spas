import { findGitRoot } from '../../../src/utils/git';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Git Utils', () => {
    const testDir = join(tmpdir(), 'spas-git-test-' + Date.now());
    
    beforeAll(() => {
        // Create test directory structure
        mkdirSync(testDir, { recursive: true });
    });

    afterAll(() => {
        // Cleanup
        rmSync(testDir, { recursive: true, force: true });
    });

    describe('findGitRoot', () => {
        it('should return null when not in a git repository', () => {
            // Arrange - use temp directory without .git
            const nonGitDir = join(testDir, 'non-git');
            mkdirSync(nonGitDir, { recursive: true });

            // Act
            const result = findGitRoot(nonGitDir);

            // Assert
            expect(result).toBeNull();
        });

        it('should find git root when starting from git root', () => {
            // Arrange - create fake .git directory
            const gitRepoDir = join(testDir, 'git-repo');
            const gitDir = join(gitRepoDir, '.git');
            mkdirSync(gitDir, { recursive: true });

            // Act
            const result = findGitRoot(gitRepoDir);

            // Assert
            expect(result).toBe(gitRepoDir);
        });

        it('should find git root when starting from subdirectory', () => {
            // Arrange - create fake .git directory and subdirectory
            const gitRepoDir = join(testDir, 'git-repo-nested');
            const gitDir = join(gitRepoDir, '.git');
            const subDir = join(gitRepoDir, 'src', 'components');
            mkdirSync(gitDir, { recursive: true });
            mkdirSync(subDir, { recursive: true });

            // Act
            const result = findGitRoot(subDir);

            // Assert
            expect(result).toBe(gitRepoDir);
        });

        it('should handle deeply nested directories', () => {
            // Arrange
            const gitRepoDir = join(testDir, 'git-repo-deep');
            const gitDir = join(gitRepoDir, '.git');
            const deepDir = join(gitRepoDir, 'a', 'b', 'c', 'd', 'e');
            mkdirSync(gitDir, { recursive: true });
            mkdirSync(deepDir, { recursive: true });

            // Act
            const result = findGitRoot(deepDir);

            // Assert
            expect(result).toBe(gitRepoDir);
        });
    });
});
