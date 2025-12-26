# Quickstart: spas-service CLI (Archive-Only)

**Feature**: 004-spas-service-cli  
**Version**: 1.0.0 (PoC)

This quickstart reflects the current workflow:

- Generate design-time metadata archives **offline** using an SDK (`--generate-metadata`).
- Publish metadata using `spas-service publish --archive <path>`.

For the canonical CLI usage, see `components/cli/spas-service/README.md`.

## Installation

```bash
npm install -g @spas/cli
spas-service --version
```

## Prerequisites

1. **SPAS Repository**: Repository service running (default: `http://localhost:3000`)
2. **Metadata archive**: A local ZIP archive (for example `./metadata/service.metadata.zip`)

## Quick Start

### Publish a locally generated archive

```bash
spas-service publish --archive ./metadata/service.metadata.zip --repo http://localhost:3000
```

### Dry run (inspect without publishing)

```bash
spas-service publish --archive ./metadata/service.metadata.zip --dry-run --output ./archives
```

### Pull a service

```bash
spas-service pull order-service 1.0.0 --repo http://localhost:3000 --output ./archives
```

## Configuration

```bash
# Windows PowerShell
$env:SPAS_REPOSITORY_URL = "http://localhost:3000"

# Then omit --repo
spas-service publish --archive ./metadata/service.metadata.zip
```
