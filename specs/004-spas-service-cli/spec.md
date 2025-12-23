# Feature Specification: SPAS-Service CLI Tool

**Feature Branch**: `004-spas-service-cli`  
**Created**: 2025-12-14  
**Completed**: 2025-12-14  
**Status**: ✅ Complete (PoC)
**Input**: User description: "Create spas-service CLI tool which assists developer in publishing SPAS service metadata package to SPAS repository. CLI should support workflow: developer runs spas-service publish command with service-host argument, CLI prompts to start service, then downloads metadata ZIP via GET /_spas/metadata endpoint, and publishes via POST /services/{serviceName}:{version}"

## Overview

The `spas-service` CLI is a command-line tool that streamlines the SPAS service publishing workflow. It bridges the gap between local service development (using SPAS SDKs) and the SPAS Repository, enabling developers to publish their service metadata with a single command.

### Key Workflow

1. Developer develops a service using a SPAS SDK (e.g., .NET SDK)
2. Developer runs `spas-service publish <service-host>` command
3. CLI prompts developer to start service and wait for confirmation
4. CLI downloads the metadata archive from service's `/_spas/metadata` endpoint
5. CLI publishes the archive to SPAS Repository via `POST /services/{serviceName}:{version}`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publish Service Metadata (Priority: P1)

A developer has completed building a SPAS-compliant service using the .NET SDK. They want to publish the service metadata to a SPAS Repository so other teams can discover and compose with their service. The developer runs the publish command, starts their service when prompted, and the CLI handles downloading and uploading the metadata automatically.

**Why this priority**: This is the core value proposition of the CLI - enabling the primary publish workflow with minimal friction.

**Independent Test**: Can be fully tested by running `spas-service publish http://localhost:5000 --repo http://localhost:3000` against a running SDK service and Repository, verifying the service appears in Repository search results.

**Acceptance Scenarios**:

1. **Given** a SPAS SDK service at `http://localhost:5000` exposing `/_spas/metadata`, **When** the developer runs `spas-service publish http://localhost:5000 --repo http://localhost:3000` and presses Enter after starting the service, **Then** the CLI downloads the metadata archive and publishes it to the Repository successfully.

2. **Given** a successful publish, **When** the developer queries `GET /services/{serviceName}` on the Repository, **Then** the published service metadata is returned.

3. **Given** a service at `http://localhost:5000`, **When** the developer runs `spas-service publish http://localhost:5000` without `--repo`, **Then** the CLI uses the default repository URL from configuration or environment variable.

---

### User Story 2 - Dry Run Mode (Priority: P2)

A developer wants to verify what would be published without actually publishing to the Repository. They run the publish command with a `--dry-run` flag to download and inspect the metadata locally.

**Why this priority**: Provides safety and transparency before committing to a publish action. Reduces risk of publishing incorrect metadata.

**Independent Test**: Can be tested by running `spas-service publish http://localhost:5000 --dry-run` and verifying the ZIP is saved locally without any Repository interaction.

**Acceptance Scenarios**:

1. **Given** a SPAS SDK service at `http://localhost:5000`, **When** the developer runs `spas-service publish http://localhost:5000 --dry-run`, **Then** the CLI downloads the metadata archive and saves it locally without publishing.

2. **Given** dry-run mode, **When** the download completes, **Then** the CLI displays the archive contents summary (spas.json identity, schemas count) and the local file path.

3. **Given** dry-run mode, **When** the download completes, **Then** no HTTP requests are made to the Repository.

---

### User Story 3 - Publish Pre-Packaged Archive (Priority: P3)

A developer has a pre-built metadata archive (e.g., from CI/CD pipeline) and wants to publish it directly without running a service. They use the `--archive` flag to specify the local ZIP file.

**Why this priority**: Enables CI/CD integration and offline publishing scenarios. Decouples build from publish.

**Independent Test**: Can be tested by running `spas-service publish --archive ./my-service-1.0.0.zip --repo http://localhost:3000` and verifying the service appears in Repository.

**Acceptance Scenarios**:

1. **Given** a valid SPAS archive at `./my-service-1.0.0.zip`, **When** the developer runs `spas-service publish --archive ./my-service-1.0.0.zip --repo http://localhost:3000`, **Then** the CLI publishes the archive without prompting to start a service.

2. **Given** an archive without spas.json, **When** the developer runs `spas-service publish --archive ./invalid.zip`, **Then** the CLI fails with a clear validation error before attempting to publish.

3. **Given** archive mode, **When** publishing succeeds, **Then** the CLI displays the same success output as interactive mode.

---

### User Story 4 - Pull Service Metadata (Priority: P3)

A developer wants to download a service's metadata archive from the Repository to understand its contracts, schemas, or for local development.

**Why this priority**: Enables consumption of published services. Required for composition workflows.

**Independent Test**: Can be tested by running `spas-service pull order-service 1.0.0 --repo http://localhost:3000` and verifying the ZIP is downloaded locally.

**Acceptance Scenarios**:

1. **Given** a published service `order-service:1.0.0` in the Repository, **When** the developer runs `spas-service pull order-service 1.0.0 --repo http://localhost:3000`, **Then** the CLI downloads the archive to current directory as `order-service-1.0.0.zip`.

2. **Given** the `--output` flag is specified, **When** the developer runs `spas-service pull order-service 1.0.0 --output ./services/`, **Then** the archive is saved to the specified directory.

3. **Given** a non-existent service version, **When** the developer runs `spas-service pull unknown-service 1.0.0`, **Then** the CLI fails with a clear "not found" error message.

---

### Edge Cases

- What happens when the service is not running or `/_spas/metadata` returns 404? → CLI fails with clear error: "Service metadata endpoint not available. Ensure service is running in Development mode."
- What happens when the service `/_spas/metadata` returns non-Development mode response? → CLI fails with hint: "Metadata endpoint disabled. Set ASPNETCORE_ENVIRONMENT=Development"
- What happens when Repository rejects the archive (validation error)? → CLI displays Repository's error message verbatim
- What happens when Repository returns 409 Conflict (duplicate version)? → CLI displays: "Version already published. Increment version or use --force to republish" (--force deferred)
- What happens when network fails mid-download or mid-upload? → CLI fails with clear network error, suggests retry
- What happens with very large archives (>10MB)? → CLI displays progress indication
- What happens when user presses Enter before service is ready? → CLI retries with backoff for 30 seconds before failing

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CLI MUST provide `spas-service publish <service-host>` command that downloads metadata from `/_spas/metadata` and publishes to Repository
- **FR-002**: CLI MUST prompt user with "Start your service at {service-host} and press Enter to continue..." before attempting download
- **FR-003**: CLI MUST extract `serviceName` and `version` from the downloaded `spas.json` to construct the Repository publish URL
- **FR-004**: CLI MUST publish via `POST /services/{serviceName}:{version}` with multipart form-data containing the archive
- **FR-005**: CLI MUST support `--repo <url>` flag to specify Repository URL (default: from config or `SPAS_REPOSITORY_URL` env var)
- **FR-006**: CLI MUST support `--dry-run` flag that downloads and displays archive info without publishing
- **FR-007**: CLI MUST support `--archive <path>` flag to publish a local ZIP file instead of downloading from service
- **FR-008**: CLI MUST provide `spas-service pull <name> <version>` command to download archive from Repository
- **FR-009**: CLI MUST support `--output <dir>` flag for pull command to specify download directory
- **FR-010**: CLI MUST display clear error messages with actionable hints for all failure scenarios
- **FR-011**: CLI MUST exit with non-zero exit code on failure (exit code 1)
- **FR-012**: CLI MUST display success message with published service identity on successful publish

### Non-Functional Requirements

- **NFR-001**: CLI MUST be implemented as a Node.js tool (aligns with Repository tech stack)
- **NFR-002**: CLI MUST support installation via npm (`npm install -g @spas/cli`)
- **NFR-003**: CLI response time for publish SHOULD be under 10 seconds for typical archives (<1MB)
- **NFR-004**: CLI MUST work on Windows, macOS, and Linux

### Key Entities

- **ServiceHost**: URL of the running SPAS service (e.g., `http://localhost:5000`)
- **MetadataArchive**: ZIP file containing `spas.json` and `schemas/` directory
- **RepositoryURL**: URL of the SPAS Repository API (e.g., `http://localhost:3000`)
- **ServiceIdentity**: Combination of serviceName and version extracted from spas.json

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can publish a service with a single command in under 30 seconds (including service startup)
- **SC-002**: 100% of publish attempts to a healthy Repository with valid archives succeed on first try
- **SC-003**: Error messages provide actionable guidance (no cryptic stack traces)
- **SC-004**: Dry-run mode allows developers to verify metadata before publishing
- **SC-005**: Pull command enables downloading any published service in under 5 seconds

## Assumptions

- The SPAS SDK is already configured correctly and `/_spas/metadata` endpoint works as documented
- The SPAS Repository is running and accessible at the configured URL
- The developer has network access to both the service and Repository
- The metadata archive format from SDK matches Repository expectations (alignment verified as Phase 3 pre-work)
- Default repository URL will be configurable via `~/.spas/config.yaml` or `SPAS_REPOSITORY_URL` environment variable

## Dependencies

- SPAS .NET SDK's `/_spas/metadata` endpoint (already implemented)
- SPAS Repository's publish and download APIs (already implemented)
- Archive format alignment between SDK and Repository (Phase 3 Task 1 pre-work)

## Out of Scope (PoC)

- `spas-service init` command (service scaffolding)
- `spas-service validate` command (local validation without publish)
- `spas-compose` commands (deferred to later Phase 3)
- Configuration file management (`~/.spas/config.yaml` creation/editing)
- `--force` flag to overwrite existing versions
- Authentication/authorization with Repository
- Progress bars for large file transfers (simple text output is sufficient)
