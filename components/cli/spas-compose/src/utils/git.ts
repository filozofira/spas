/**
 * Git utility functions
 */

import { existsSync } from "fs";
import { join, dirname, resolve } from "path";

/**
 * Find the root of the git repository by searching upward for .git directory
 *
 * @param startPath Path to start searching from
 * @returns Absolute path to git root, or null if not in a git repository
 */
export function findGitRoot(startPath: string): string | null {
  let currentPath = resolve(startPath);

  // Prevent infinite loops - track visited paths
  const visited = new Set<string>();

  while (currentPath && !visited.has(currentPath)) {
    visited.add(currentPath);

    // Check if .git directory exists
    const gitPath = join(currentPath, ".git");
    if (existsSync(gitPath)) {
      return currentPath;
    }

    // Move to parent directory
    const parentPath = dirname(currentPath);

    // Check if we've reached the filesystem root
    if (parentPath === currentPath) {
      break;
    }

    currentPath = parentPath;
  }

  return null;
}
