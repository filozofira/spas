# Implementation Plan: Remove Publish Service Prompt

**Branch**: `020-publish-no-prompt` | **Date**: 2025-12-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/020-publish-no-prompt/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Remove the interactive "Start your service and press Enter" prompt from `spas-service publish` command and replace it with automatic retry logic using exponential backoff (4 attempts: 1s, 2s, 4s, 8s). This enables CI/CD automation and reduces friction for developers with services already running. Retry only on connection-level errors; fail fast on HTTP errors (404, 500).

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js CLI)  
**Primary Dependencies**: Commander.js (CLI framework), Axios or fetch (HTTP client)  
**Storage**: N/A (CLI tool, no data persistence)  
**Testing**: Jest (unit tests)  
**Target Platform**: Node.js CLI (cross-platform)
**Project Type**: Single CLI project  
**Performance Goals**: Retry window ≤15 seconds total  
**Constraints**: No stdin required (CI/CD compatible); backward compatible with existing --archive and --dry-run flags  
**Scale/Scope**: ~100 lines of code change + ~50 lines of test modifications

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single Bounded Context | ✅ N/A | CLI tool, not a service |
| II. No Direct Service-to-Service | ✅ N/A | CLI tool, not a service |
| III. Event-First Integration | ✅ N/A | CLI tool, not a service |
| IV. Convention Over Configuration | ✅ Pass | Follows existing CLI conventions |
| V. Security by Default | ✅ N/A | No security impact |
| VI. Observability First | ✅ N/A | CLI tool, not a service |
| VII. Portable Packaging | ✅ N/A | CLI already npm-packaged |
| VIII. Adaptable Through Configuration | ✅ Pass | --no-retry flag provides opt-out |
| CLI Quality Gates | ✅ Pass | Unit tests required for retry logic |

**Gate Result**: ✅ PASS - No violations

## Project Structure

### Documentation (this feature)

```text
specs/020-publish-no-prompt/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output (N/A - no research needed)
├── checklists/
│   └── requirements.md  # Requirement checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
components/cli/spas-service/
├── src/
│   ├── commands/
│   │   └── publish.ts           # ← MODIFY: Remove readline prompt
│   └── services/
│       └── publish-service.ts   # ← MODIFY: Add retry logic with backoff
└── test/
    └── unit/
        └── services/
            └── publish-service.test.ts  # ← MODIFY: Update tests for new behavior
```

**Structure Decision**: Minimal change - modify existing publish-service.ts to remove promptUser() method and add retryWithBackoff() method. No new files needed.

## Implementation Details

### Phase 0: Research

**Status**: Not needed - implementation location and approach are clear

The publish workflow is in `components/cli/spas-service/src/services/publish-service.ts`. Current behavior uses readline to prompt user at line ~115. The prompt is called from the `publish()` method before attempting to download metadata.

**Key Findings:**
1. Current prompt location: `promptUser()` method in PublishService class
2. Metadata download: `downloadMetadata()` method (already exists)
3. Archive mode: Bypasses download entirely (no changes needed)
4. Dry-run mode: Uses same download path (retry logic applies)
5. HTTP client: Uses axios for service communication
6. Test mocking: Current tests mock readline.createInterface

### Phase 1: Design

**Changes Required:**

1. **Remove `promptUser()` method** from PublishService class
   - Delete the entire method (~20 lines)
   - Remove call to `promptUser()` in `publish()` method

2. **Add `retryWithBackoff()` method** to PublishService class
   - Parameters: `operation: () => Promise<T>`, `maxAttempts: number`, `delays: number[]`
   - Retry only on connection-level errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND)
   - Fail immediately on HTTP errors (status 4xx, 5xx)
   - Display status message before each retry: "Waiting for service... (attempt X/Y)"
   - Return error with full details when exhausted

3. **Modify `downloadMetadata()` method**
   - Wrap HTTP call in `retryWithBackoff()` when `skipRetry` flag is false
   - Check if using `--archive` mode → skip retry logic
   - Classify errors: connection vs HTTP

4. **Add `--no-retry` flag** to publish command
   - Update command definition in `src/commands/publish.ts`
   - Pass flag through to PublishService

5. **Update error messages**
   - Format: "Failed to connect to {url} after {n} attempts ({time}s). Ensure your service is running and accessible."
   - Include all required fields from FR-005

**Test Changes:**
- Remove tests that verify readline prompt behavior
- Add tests for retry with exponential backoff
- Add tests for error classification (connection vs HTTP)
- Add tests for --no-retry flag
- Update existing integration tests to not expect prompt

### Data Model

N/A - No data model changes; this is behavior modification only.

### Contracts

N/A - No API contracts; CLI command behavior is internal.

## Quickstart

After implementation, the workflow will be:

1. **Developer starts their service:**
   ```bash
   cd my-service
   dotnet run
   ```

2. **In a separate terminal, publish immediately (no prompt):**
   ```bash
   spas-service publish http://localhost:5000 --repo http://localhost:3000
   ```

3. **CLI retries automatically if service not ready:**
   ```
   Waiting for service... (attempt 1/4)
   Waiting for service... (attempt 2/4)
   ✓ Metadata downloaded successfully
   ✓ Published to repository: order-service:1.0.0
   ```

4. **For CI/CD pipelines, same command works without stdin:**
   ```bash
   #!/bin/bash
   npm run build
   dotnet run &
   SERVICE_PID=$!
   spas-service publish http://localhost:5000 --repo $REPO_URL
   kill $SERVICE_PID
   ```

5. **To disable retry (fail fast):**
   ```bash
   spas-service publish http://localhost:5000 --no-retry
   ```

## Complexity Tracking

> No Constitution violations to justify - all gates passed.

| Item | Complexity | Notes |
|------|------------|-------|
| Remove readline prompt | Low | Delete method and call site (~20 lines) |
| Add retry with backoff | Medium | New retry logic with error classification (~50 lines) |
| Error classification | Low | Distinguish connection vs HTTP errors (~10 lines) |
| Test updates | Medium | Modify ~10 existing tests, add ~5 new tests |
| No breaking CLI flags | ✅ | --archive, --dry-run, --repo unchanged |

