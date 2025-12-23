# Feature Specification: Remove Publish Service Prompt

**Feature Branch**: `020-publish-no-prompt`  
**Created**: 2025-12-23  
**Status**: Draft  
**Input**: User description: "Remove prompt to start service from spas-service publish cli command"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Direct Publish Without Prompt (Priority: P1)

A developer has their SPAS service already running and wants to publish metadata to the Repository. Currently, the CLI prompts "Start your service at {host} and press Enter to continue..." which adds friction to the workflow—especially in CI/CD pipelines, scripts, and when the service is already running. The developer expects the CLI to immediately attempt to download metadata without requiring manual confirmation.

**Why this priority**: Removes unnecessary friction from the primary publish workflow. Enables seamless CI/CD integration and scripted automation.

**Independent Test**: Run `spas-service publish http://localhost:5000 --repo http://localhost:3000` with service already running and verify the CLI immediately downloads metadata without waiting for user input.

**Acceptance Scenarios**:

1. **Given** a running SPAS SDK service at `http://localhost:5000`, **When** the developer runs `spas-service publish http://localhost:5000`, **Then** the CLI immediately attempts to download metadata from `/_spas/metadata` without prompting.
2. **Given** a running service, **When** the publish command is executed in a non-interactive environment (CI/CD), **Then** the command completes without hanging or requiring stdin input.
3. **Given** a service that is not yet running, **When** the CLI attempts to download metadata, **Then** the CLI fails with a clear error message indicating the service is unreachable.

---

### User Story 2 - Retry on Service Unavailable (Priority: P2)

A developer starts the publish command before their service is fully ready. Without the prompt, the CLI should provide a brief retry window to handle race conditions where the service is still starting.

**Why this priority**: Provides graceful handling for the common case where the developer runs publish slightly before the service is ready, without requiring an interactive prompt.

**Independent Test**: Start a service with a 2-second startup delay, immediately run publish, and verify the CLI retries and succeeds.

**Acceptance Scenarios**:

1. **Given** a service that becomes available within the retry window, **When** the initial connection fails, **Then** the CLI retries with exponential backoff and succeeds when the service responds.
2. **Given** retry behavior, **When** the CLI retries, **Then** it displays status messages like "Waiting for service... (attempt 2/5)".
3. **Given** a service that never becomes available, **When** all retries are exhausted, **Then** the CLI fails with a clear error message and non-zero exit code.

---

### Edge Cases

- What happens when stdin is not a TTY (CI/CD environment)? → CLI works without any prompt, same as interactive mode.
- What happens when the service takes longer than the retry window? → CLI fails with a timeout error suggesting the user verify the service is running.
- What happens with the existing `--archive` flag? → No change; archive mode bypasses service download entirely.
- What happens with `--dry-run`? → Works the same, just without the prompt before attempting download.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `spas-service publish` MUST NOT prompt user with "Start your service at {host} and press Enter to continue...".
- **FR-002**: `spas-service publish` MUST immediately attempt to download metadata from the service endpoint.
- **FR-003**: CLI MUST retry failed connection attempts with exponential backoff (default: 5 attempts, 1s initial delay, 2x multiplier).
- **FR-004**: CLI MUST display retry status messages to inform the user of connection attempts.
- **FR-005**: CLI MUST fail with a clear error message when all retry attempts are exhausted.
- **FR-006**: CLI MUST support `--no-retry` flag to disable retry behavior and fail immediately on first connection error.
- **FR-007**: CLI MUST work identically in interactive and non-interactive (CI/CD) environments.

### Non-Functional Requirements

- **NFR-001**: Total retry time MUST NOT exceed 30 seconds by default.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `spas-service publish` completes without requiring any stdin input.
- **SC-002**: CI/CD pipelines can execute publish command without hanging or special TTY configuration.
- **SC-003**: Developer can publish to an already-running service in under 5 seconds (excluding upload time).
- **SC-004**: Retry behavior allows successful publish when service becomes available within 30 seconds.

## Assumptions

- The developer is expected to have their service running before executing the publish command (or within the retry window).
- Removing the prompt is a breaking change to the current UX but improves automation and reduces friction.
- Existing tests that mock the prompt behavior will need to be updated.

## Dependencies

- Existing `spas-service` CLI codebase (004-spas-service-cli)
- No external dependencies introduced

## Out of Scope

- Adding a `--wait` flag to explicitly prompt (inverse of current behavior)
- Health check polling beyond simple connection retry
- Changes to `--archive` mode (already bypasses service interaction)
