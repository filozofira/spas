# spas-service CLI

Command-line tool for publishing and pulling SPAS service metadata archives.

## Install

### Global install

```bash
npm install -g @spas/cli
```

### From source (development)

```bash
cd components/cli/spas-service
npm install
npm run build
npm link
```

## Publish

### From a running service

The service must expose `/_spas/metadata` (typically Development mode).

```bash
spas-service publish http://localhost:5000 --repo http://localhost:3000
```

### From a pre-built archive

```bash
spas-service publish --archive ./order-service-1.0.0.zip --repo http://localhost:3000
```

### Dry run

Downloads and inspects metadata, but does not publish.

```bash
spas-service publish http://localhost:5000 --dry-run --output ./archives
```

### Add runtime image metadata (optional)

```bash
spas-service publish --archive ./order-service-1.0.0.zip \
  --repo http://localhost:3000 \
  --image-repository ghcr.io/myorg/order-service \
  --image-tag 1.0.0 \
  --image-digest sha256:abc123def456...
```

## Pull

```bash
spas-service pull order-service 1.0.0 --repo http://localhost:3000 --output ./archives
```

## Configuration

- `SPAS_REPOSITORY_URL` sets the default repository URL when `--repo` is omitted (default: `http://localhost:3000`).

Schema reference:

- [../../sdk/schemas/design-time-metadata-v1.schema.json](../../sdk/schemas/design-time-metadata-v1.schema.json)

