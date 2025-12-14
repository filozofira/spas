# Research: SPAS-Service CLI Tool

**Feature**: 004-spas-service-cli  
**Created**: 2025-12-14

## Phase 0 Research Tasks

### 1. SDK Archive Format vs Repository Expectations

**Task**: Compare SDK's `/_spas/metadata` output structure with Repository test fixtures

**Finding**: Format Mismatch Identified

| Aspect                        | SDK Current Output                           | Repository Expectation                                                          |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| spas.json field: service ID   | `serviceId`                                  | `id`                                                                            |
| spas.json field: service name | `serviceName`                                | `name`                                                                          |
| spas.json field: contracts    | `contracts.commands[]`, `contracts.events[]` | `endpoints[]`, `events[]`                                                       |
| Schema paths                  | `schemas/*.schema.json` (flat)               | `schemas/endpoints/*.schema.json`, `schemas/events/*.schema.json` (categorized) |
| Schema version field          | Missing                                      | `schemaVersion: "design-time-metadata-v1"`                                      |

**Decision**: SDK must be updated to match Repository's expected format
**Rationale**: Repository validation is already implemented and aligned with `design-time-metadata-v1.schema.json`. Updating SDK is less disruptive than changing Repository.
**Alternatives Rejected**: Changing Repository validation would affect existing test fixtures and published documentation.

### 2. CLI Technology Stack Decision

**Task**: Determine CLI implementation technology

**Options Evaluated**:

| Option                     | Pros                                                                      | Cons                                                             |
| -------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Node.js + Commander.js** | Aligns with Repository (same stack), npm distribution, async I/O built-in | Another runtime dependency for .NET developers                   |
| **C# / .NET Global Tool**  | Same ecosystem as SDK, single runtime, NuGet distribution                 | Different stack than Repository, more complex multipart handling |
| **Go**                     | Single binary distribution, cross-platform, fast                          | New language in project, no existing patterns                    |

**Decision**: Node.js + Commander.js
**Rationale**:

1. Aligns with Repository tech stack (code sharing opportunities for HTTP client, validation)
2. npm distribution is well-established for CLI tools
3. Easier multipart/form-data handling with native `form-data` package
4. Reduces technology fragmentation (Repository already Node.js)
5. Developers targeting SPAS likely already have Node.js for Repository

**Alternatives Rejected**:

- .NET: Would require duplication of HTTP client logic, different serialization patterns
- Go: Introduces new language, no existing codebase to leverage

### 3. Archive Handling Approach

**Task**: Determine how CLI handles ZIP archives

**Decision**: Use `adm-zip` for extraction (read spas.json to get service identity) and raw stream for upload
**Rationale**: Need to extract spas.json to get serviceName and version for URL construction, but upload original ZIP unchanged to Repository.

### 4. Configuration Management

**Task**: Determine default repository URL handling

**Decision**: Priority order for repository URL:

1. `--repo` command-line flag (highest priority)
2. `SPAS_REPOSITORY_URL` environment variable
3. `~/.spas/config.yaml` file (future - deferred for PoC)
4. Default: `http://localhost:3000` (development convenience)

**Rationale**: Environment variable is 12-factor app compliant and simpler than config file for PoC.

### 5. Retry Logic for Service Availability

**Task**: Handle case when user presses Enter before service is ready

**Decision**: Implement retry with exponential backoff

- Max retries: 5
- Initial delay: 1 second
- Backoff multiplier: 2x
- Max delay: 16 seconds
- Total max wait: ~30 seconds

**Rationale**: Services may take time to start, especially .NET apps with warm-up. Backoff prevents hammering the endpoint.

### 6. Simplified Publish Workflow (ADR-035)

**Task**: Determine CLI command structure for service publishing

**Original Spec** (`principles/component/13-cli.md`):

- `spas-service metadata get` — Fetch design-time metadata from service
- `spas-service pack` — Create SPAS archive
- `spas-service publish` — Publish archive to repository

**Decision**: Consolidate into single `spas-service publish` command with optional flags:

- `--dry-run` — Download and inspect metadata without publishing (replaces `metadata get` + `pack`)
- `--archive <path>` — Publish pre-built archive (enables CI/CD without running service)

**Rationale**:

1. SDK's `/_spas/metadata` already produces complete ZIP archive (spas.json + schemas)
2. Separate `pack` command would duplicate SDK functionality
3. Single command reduces developer cognitive load
4. `--dry-run` provides inspection capability originally planned for `metadata get`
5. `--archive` supports CI/CD pipelines where service cannot run

**Alternatives Rejected**:

- Separate `metadata get` + `pack` + `publish` commands: Adds complexity without PoC value; SDK already produces archive
- No `--dry-run`: Developers need inspection before publishing; reduces risk
- No `--archive`: Would require running service for every publish; blocks CI/CD automation

**Impact on Constitution**:

- Constitution lists `metadata get`, `pack` as mandatory commands
- This decision defers them by consolidating functionality into `publish` with flags
- Full compliance achieved: `--dry-run` = metadata get + pack; `--archive` = offline pack result

## Resolution Summary

All NEEDS CLARIFICATION items have been resolved:

- Technology: Node.js + Commander.js
- SDK alignment: Must be done as prerequisite task
- Configuration: Environment variable + CLI flag
- Error handling: Retry with backoff for availability checks

## SDK Alignment Tasks (Prerequisite)

Before CLI implementation can proceed, SDK must be updated:

1. **T001a**: Compare SDK's `/_spas/metadata` output with Repository fixtures - **DONE** (this research)
2. **T001b**: Update `MetadataArchiveWriter` to produce correct field names (`id` not `serviceId`, etc.)
3. **T001c**: Update `MetadataArchiveWriter` to use categorized schema paths (`schemas/endpoints/`, `schemas/events/`)
4. **T001d**: Update SDK tests to validate correct format
5. **T001e**: Integration validation - POST SDK archive to Repository, verify success
