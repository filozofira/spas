/**
 * Version Validator
 * 
 * Validates semantic versioning format (MAJOR.MINOR.PATCH)
 * and provides version comparison utilities.
 */

export class VersionValidator {
  private static SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

  /**
   * Validate that version follows MAJOR.MINOR.PATCH format
   */
  static validate(version: string): void {
    if (!this.SEMVER_PATTERN.test(version)) {
      throw new VersionError(
        'Invalid version format',
        `Version '${version}' does not match MAJOR.MINOR.PATCH format`
      );
    }
  }

  /**
   * Parse semantic version string into components
   */
  static parse(version: string): { major: number; minor: number; patch: number } {
    this.validate(version);
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch };
  }

  /**
   * Compare two versions
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  static compare(v1: string, v2: string): number {
    this.validate(v1);
    this.validate(v2);

    const p1 = this.parse(v1);
    const p2 = this.parse(v2);

    if (p1.major !== p2.major) {
      return p1.major < p2.major ? -1 : 1;
    }
    if (p1.minor !== p2.minor) {
      return p1.minor < p2.minor ? -1 : 1;
    }
    if (p1.patch !== p2.patch) {
      return p1.patch < p2.patch ? -1 : 1;
    }

    return 0;
  }

  /**
   * Get latest version from array of versions
   */
  static latest(versions: string[]): string | null {
    if (versions.length === 0) {
      return null;
    }

    return versions.reduce((max, current) => {
      return this.compare(current, max) > 0 ? current : max;
    });
  }

  /**
   * Sort versions in descending order (latest first)
   */
  static sortDescending(versions: string[]): string[] {
    return [...versions].sort((a, b) => this.compare(b, a));
  }
}

export class VersionError extends Error {
  constructor(
    public code: string,
    public details: string
  ) {
    super(`${code}: ${details}`);
    this.name = 'VersionError';
  }
}
