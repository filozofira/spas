# Quickstart: Publish Without Prompt (Archive-Only)

**Feature**: 020-publish-no-prompt  
**Status**: Superseded  

This quickstart originally validated publishing by downloading metadata from a running service without prompting. The SPAS workflow has since been simplified:

- Services generate design-time metadata archives **offline** via the SDK (`--generate-metadata`).
- `spas-service publish` is **archive-only** and does not prompt.

## Prerequisites

- Node.js 20+ installed
- SPAS Repository service running at http://localhost:3000
- A metadata archive ZIP on disk (for example `./metadata/service.metadata.zip`)

## Validation Scenarios

### Scenario 1: Publish from a local archive

1. Generate an archive using your SDK (example: .NET):
   ```bash
   cd examples/services/order-service
   dotnet run -- --generate-metadata --output ./metadata
   ```

2. Publish:
   ```bash
   cd components/cli/spas-service
   npm run cli -- publish --archive ../../examples/services/order-service/metadata/service.metadata.zip --repo http://localhost:3000
   ```

3. **Verify**: No prompt appears; publish completes successfully.

---

### Scenario 2: Dry-run inspection (no publish)

1. Run dry-run:
   ```bash
   cd components/cli/spas-service
   npm run cli -- publish --archive ../../examples/services/order-service/metadata/service.metadata.zip --dry-run --output ./archives
   ```

2. **Verify**: Repository is not called; an archive copy is written to `./archives`.
