# Changelog

All notable changes to `@spas/cli` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **BREAKING**: `spas-service publish` is now archive-only
  - Removed the positional `<service-host>` argument and the legacy runtime metadata endpoint workflow
  - `--archive <path>` is required for publish operations

### Added

- `spas-service publish --dry-run --archive <path>` now inspects the archive without publishing

### Fixed

- CLI docs and help text aligned to offline archive publishing

## [0.1.0] - Initial Release

- Initial implementation of `spas-service publish` command
- Initial implementation of `spas-service pull` command
- Support for `--archive`, `--dry-run`, `--repo`, `--output` flags
- Support for runtime image metadata (`--image-digest`, `--image-repository`, `--image-tag`)
