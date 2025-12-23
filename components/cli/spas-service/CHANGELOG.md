# Changelog

All notable changes to `@spas/cli` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **BREAKING**: Removed interactive prompt from `spas-service publish` command
  - The CLI no longer prompts "Start your service at {host} and press Enter to continue..."
  - Command now immediately attempts to download metadata from the service
  - Enables seamless CI/CD integration and scripted automation

### Added

- Automatic retry logic with exponential backoff for service connections
  - 4 attempts with delays: 1s, 2s, 4s, 8s (15 seconds total window)
  - Retries only on connection errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND, ECONNRESET, ENETUNREACH)
  - Fails immediately on HTTP errors (404, 500) without retry
  - Status messages: "Waiting for service... (attempt X/4)"
- New `--no-retry` flag to disable retry logic and fail immediately on first connection error
- Clear error messages with URL, attempt count, elapsed time, and troubleshooting guidance

### Fixed

- CLI now works correctly in non-interactive environments (CI/CD pipelines, scripts)
- No stdin input required for publish operations

## [0.1.0] - Initial Release

- Initial implementation of `spas-service publish` command
- Initial implementation of `spas-service pull` command
- Support for `--archive`, `--dry-run`, `--repo`, `--output` flags
- Support for runtime image metadata (`--image-digest`, `--image-repository`, `--image-tag`)
