# Data Model

## Implementation Notes

The Repository Service separates design-time metadata (from service's spas.json) from runtime deployment metadata (added by Repository during publish).

## Database Schema

### Services Table

Stores service metadata with dedicated columns for runtime information:

- **Core Identity**
  - `service_id`: string (NOT NULL)
  - `version`: string (NOT NULL)
  - `name`: string (NOT NULL)
  - `description`: string (NOT NULL)
  - `bounded_context`: string (NOT NULL)

- **Design-Time Metadata**
  - `capabilities`: JSON array
  - `metadata`: JSON object (complete spas.json)

- **Runtime Metadata** (added by Repository)
  - `image_digest`: string (optional) - SHA256 digest
  - `image_repository`: string (optional) - e.g., ghcr.io/org/service
  - `image_tag`: string (optional) - e.g., 1.0.0, latest

- **Audit Fields**
  - `published_at`: datetime
  - `created_at`: datetime
  - `updated_at`: datetime

**Constraints:**
- UNIQUE(service_id, version)
- CHECK(json_valid(metadata))
- CHECK(json_valid(capabilities))

### Schemas Table

Stores service schemas (event, internal, endpoint):

- `service_id`: string (NOT NULL, FK)
- `service_version`: string (NOT NULL, FK)
- `name`: string (NOT NULL)
- `type`: enum('event', 'internal', 'endpoint')
- `content`: JSON object (JSON Schema)
- `created_at`: datetime

**Constraints:**
- UNIQUE(service_id, service_version, name)
- FOREIGN KEY(service_id, service_version) REFERENCES services ON DELETE CASCADE
- CHECK(json_valid(content))

## API Response Models

### ServiceInfo (Lightweight)

Returned by search and latest version queries:

```typescript
{
  id: string;
  name: string;
  version: string;
  description: string;
  boundedContext: string;
  capabilities: string[];
  publishedAt: string;
  runtime?: {
    digest?: string;
    repository?: string;
    tag?: string;
    image?: string; // Computed: repository@digest or repository:tag
  };
}
```

### ServiceMetadata (Complete)

Full design-time + runtime metadata:

```typescript
{
  schemaVersion: "design-time-metadata-v1";
  id: string;
  name: string;
  version: string;
  // ... all design-time fields from spas.json
  runtime?: Runtime; // Added by Repository if provided during publish
  publishedAt: string; // Added by Repository
}
```

## Validation Rules

- **Duplicate detection**: unique (service_id, version)
- **Path authority**: `{serviceName}:{version}` in URL must match spas.json
- **Schema evolution**: additive-only (new optional fields)
- **Runtime metadata**: optional; when provided, stored in dedicated columns
