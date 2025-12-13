# Test Fixtures

This directory contains pre-generated ZIP archive fixtures for integration testing.

## Fixtures

### valid-service.zip (1436 bytes)

Complete valid service archive with:

- `spas.json` - Valid metadata for test-service:1.0.0
- `schemas/endpoints/create-order.schema.json` - CreateOrder endpoint schema
- `schemas/events/order-created.schema.json` - OrderCreated event schema

Used to test successful service publication with schemas.

### checksum-service.zip (1445 bytes)

Valid service archive for checksum verification tests:

- `spas.json` - Valid metadata for checksum-service:1.0.0
- `schemas/endpoints/create-order.schema.json`
- `schemas/events/order-created.schema.json`

Used to test checksum validation during publication.

### dup-service.zip (1445 bytes)

Valid service archive for duplicate detection tests:

- `spas.json` - Valid metadata for dup-service:1.0.0
- `schemas/endpoints/create-order.schema.json`
- `schemas/events/order-created.schema.json`

Used to test rejection of duplicate service/version combinations.

### correct-id.zip (1447 bytes)

Valid service archive for path authority validation:

- `spas.json` - Valid metadata for correct-id:1.0.0
- `schemas/endpoints/create-order.schema.json`
- `schemas/events/order-created.schema.json`

Used to test validation that service ID in path matches metadata.

### invalid-metadata.zip (219 bytes)

Archive with invalid `spas.json`:

- `spas.json` - Missing required fields (name, version, boundedContext)

Used to test rejection of invalid metadata.

### no-metadata.zip (168 bytes)

Archive without `spas.json`:

- `dummy.txt` - Placeholder file

Used to test rejection when spas.json is missing.

## Regenerating Fixtures

If you need to regenerate the fixtures (e.g., to update schemas or metadata):

```bash
npm run fixtures
```

This will run `test/scripts/create-fixtures.js` which recreates all ZIP files.

## Schema Details

All service schemas include:

- **Endpoint schemas**: JSON Schema definitions for HTTP/gRPC endpoints
- **Event schemas**: JSON Schema definitions for published events
- **Format validation**: Uses `uuid`, `email`, `date-time` formats (validated by ajv-formats)

Example endpoint schema structure:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CreateOrderRequest",
  "type": "object",
  "required": ["customerId", "items"],
  "properties": {
    "customerId": { "type": "string", "format": "uuid" },
    "items": { "type": "array", "minItems": 1 }
  }
}
```

Example event schema structure:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "OrderCreated",
  "type": "object",
  "required": ["orderId", "customerId", "amount"],
  "properties": {
    "orderId": { "type": "string", "format": "uuid" },
    "amount": { "type": "number", "minimum": 0 }
  }
}
```

## Why Pre-Generated?

These fixtures are pre-generated rather than created dynamically during tests for several reasons:

1. **Performance**: Test execution is ~10x faster (3s vs 30s)
2. **Consistency**: Same fixtures used across all test runs
3. **Debugging**: Easy to inspect fixture contents manually
4. **Isolation**: Tests don't interfere with each other
5. **Realistic**: File-based approach matches real-world usage

## Maintenance

When updating fixtures:

1. Modify `test/scripts/create-fixtures.js`
2. Run `npm run fixtures`
3. Commit updated ZIP files to git
4. Verify tests still pass with `npm test`
