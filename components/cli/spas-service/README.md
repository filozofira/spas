# spas-service CLI

Command-line tool for publishing and pulling SPAS service metadata archives.

## For Users

### Install

```bash
npm install -g @spas/cli
```

### Publish

#### Publish a locally generated archive

Generate the archive using your SDK, then publish it:

- .NET: [components/sdk/dotnet/README.md](../../sdk/dotnet/README.md)
- Java: [components/sdk/java/README.md](../../sdk/java/README.md)

```bash
spas-service publish --archive ./metadata/service.metadata.zip --repo http://localhost:3000
```

#### From a pre-built archive

```bash
spas-service publish --archive ./order-service-1.0.0.zip --repo http://localhost:3000
```

#### Dry run

Inspects metadata, but does not publish.

```bash
spas-service publish --archive ./metadata/service.metadata.zip --dry-run --output ./archives
```

#### Add runtime image metadata (optional)

```bash
spas-service publish --archive ./order-service-1.0.0.zip \
  --repo http://localhost:3000 \
  --image-repository ghcr.io/myorg/order-service \
  --image-tag 1.0.0 \
  --image-digest sha256:abc123def456...
```

### Pull

```bash
spas-service pull order-service 1.0.0 --repo http://localhost:3000 --output ./archives
```

### Configuration

- `SPAS_REPOSITORY_URL` sets the default repository URL when `--repo` is omitted (default: `http://localhost:3000`).

### Additional Resources

- [Design-Time Metadata Schema](../../schemas/design-time-metadata-v1.schema.json)

## For Contributors

See [CONTRIBUTING.md](./CONTRIBUTING.md).

