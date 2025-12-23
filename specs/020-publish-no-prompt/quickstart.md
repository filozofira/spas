# Quickstart: Remove Publish Service Prompt

**Feature**: 020-publish-no-prompt  
**Purpose**: Validate the new publish workflow without interactive prompt

## Prerequisites

- Node.js 18+ installed
- SPAS Repository service running at http://localhost:3000
- A SPAS SDK service (e.g., .NET service with metadata endpoint)

## Validation Scenarios

### Scenario 1: Publish with Service Already Running

**Goal**: Verify CLI immediately downloads metadata without prompting

1. Start your SPAS service:
   ```bash
   cd examples/services/order-service
   dotnet run
   ```

2. In a separate terminal, publish:
   ```bash
   cd components/cli/spas-service
   npm run cli -- publish http://localhost:5000 --repo http://localhost:3000
   ```

3. **Expected output**:
   ```
   Downloading metadata from http://localhost:5000/_spas/metadata...
   ✓ Metadata downloaded successfully
   Publishing to repository...
   ✓ Published to repository: order-service:1.0.0
   ```

4. **Verify**: No prompt appears; command completes in <5 seconds

---

### Scenario 2: Publish with Service Startup Delay

**Goal**: Verify retry logic handles service still starting

1. Start publish command FIRST:
   ```bash
   npm run cli -- publish http://localhost:5000 --repo http://localhost:3000
   ```

2. Within 2 seconds, start the service:
   ```bash
   cd examples/services/order-service
   dotnet run
   ```

3. **Expected output**:
   ```
   Downloading metadata from http://localhost:5000/_spas/metadata...
   Waiting for service... (attempt 1/4)
   Waiting for service... (attempt 2/4)
   ✓ Metadata downloaded successfully
   Publishing to repository...
   ✓ Published to repository: order-service:1.0.0
   ```

4. **Verify**: CLI retries and succeeds when service becomes available

---

### Scenario 3: Service Never Available

**Goal**: Verify clear error message after retry exhaustion

1. Ensure NO service is running at port 5000

2. Run publish command:
   ```bash
   npm run cli -- publish http://localhost:5000 --repo http://localhost:3000
   ```

3. **Expected output**:
   ```
   Downloading metadata from http://localhost:5000/_spas/metadata...
   Waiting for service... (attempt 1/4)
   Waiting for service... (attempt 2/4)
   Waiting for service... (attempt 3/4)
   Waiting for service... (attempt 4/4)
   ✗ Failed to connect to http://localhost:5000 after 4 attempts (15s).
     Ensure your service is running and accessible.
   ```

4. **Verify**: Exit code is non-zero, error message includes URL, attempts, time, and suggestion

---

### Scenario 4: HTTP Error (404 Not Found)

**Goal**: Verify immediate failure on HTTP errors without retry

1. Start a web server at port 5000 WITHOUT the /_spas/metadata endpoint:
   ```bash
   python3 -m http.server 5000
   ```

2. Run publish command:
   ```bash
   npm run cli -- publish http://localhost:5000 --repo http://localhost:3000
   ```

3. **Expected output**:
   ```
   Downloading metadata from http://localhost:5000/_spas/metadata...
   ✗ Endpoint not found: GET /_spas/metadata returned 404.
     Ensure service is running in Development mode with metadata endpoint enabled.
   ```

4. **Verify**: No retry attempts; immediate failure with actionable message

---

### Scenario 5: Disable Retry with --no-retry

**Goal**: Verify --no-retry flag bypasses retry logic

1. Ensure NO service is running at port 5000

2. Run publish command with --no-retry:
   ```bash
   npm run cli -- publish http://localhost:5000 --no-retry
   ```

3. **Expected output**:
   ```
   Downloading metadata from http://localhost:5000/_spas/metadata...
   ✗ Failed to connect to http://localhost:5000.
     Ensure your service is running and accessible.
   ```

4. **Verify**: Fails immediately on first connection error (no retry attempts)

---

### Scenario 6: CI/CD Non-Interactive Environment

**Goal**: Verify command works in scripts without TTY

1. Create test script `test-publish.sh`:
   ```bash
   #!/bin/bash
   set -e
   
   # Start service in background
   cd examples/services/order-service
   dotnet run &
   SERVICE_PID=$!
   
   # Wait for service to be ready
   sleep 3
   
   # Publish
   cd ../../components/cli/spas-service
   npm run cli -- publish http://localhost:5000 --repo http://localhost:3000
   
   # Cleanup
   kill $SERVICE_PID
   ```

2. Run in non-interactive mode:
   ```bash
   bash test-publish.sh < /dev/null
   ```

3. **Expected output**: Same as Scenario 1 (no hanging, no stdin required)

4. **Verify**: Script completes successfully with exit code 0

---

### Scenario 7: Archive Mode Unchanged

**Goal**: Verify --archive mode bypasses retry logic

1. Create a valid archive:
   ```bash
   cd examples/services/order-service
   dotnet run  # Get metadata
   wget http://localhost:5000/_spas/metadata -O order-service.zip
   ```

2. Publish with --archive:
   ```bash
   npm run cli -- publish --archive order-service.zip --repo http://localhost:3000
   ```

3. **Expected output**:
   ```
   Reading archive: order-service.zip
   ✓ Archive validated
   Publishing to repository...
   ✓ Published to repository: order-service:1.0.0
   ```

4. **Verify**: No retry logic, no service connection attempt, immediate file processing

---

### Scenario 8: Dry-Run with Retry

**Goal**: Verify --dry-run still uses retry logic

1. Start service with 2-second delay

2. Immediately run:
   ```bash
   npm run cli -- publish http://localhost:5000 --dry-run
   ```

3. **Expected output**:
   ```
   Downloading metadata from http://localhost:5000/_spas/metadata...
   Waiting for service... (attempt 1/4)
   Waiting for service... (attempt 2/4)
   ✓ Metadata downloaded successfully
   
   Dry run mode - archive saved locally: order-service-1.0.0.zip
   Would publish: order-service:1.0.0
   ```

4. **Verify**: Retry logic applies; no repository upload

---

## Success Criteria Validation

| Criterion | Validation Method | Expected Result |
|-----------|-------------------|-----------------|
| SC-001: No stdin required | Scenario 1, 6 | Command completes without prompt |
| SC-002: CI/CD compatible | Scenario 6 | Script runs without TTY |
| SC-003: Fast publish (<5s) | Scenario 1 | Completes in <5 seconds |
| SC-004: Retry window (15s) | Scenario 2 | Service available within 15s succeeds |

## Cleanup

After validation:

```bash
# Stop any running services
pkill -f "dotnet run"
pkill -f "http.server"

# Remove test archives
rm -f order-service*.zip
```
