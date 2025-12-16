# Contracts: Sidecar Transform File Loading

**Date**: 2025-12-16  
**Status**: N/A - No new API contracts

## Summary

This feature is an internal implementation fix to the sidecar's transformer service. It does not introduce or modify any external API contracts.

## Unchanged Contracts

The following contracts remain unchanged:

### Sidecar Config Schema

The `transform` field in inbound/outbound entries already accepts strings. This fix enables those strings to be file paths (ending in `.jsonata`) in addition to inline expressions.

```json
{
  "inbound": [{
    "kind": "event",
    "topic": "orders-created",
    "transform": "transformations/inbound-order-created.jsonata",  // Now loads file!
    "invokeEndpoint": "/incoming"
  }],
  "outbound": [{
    "eventType": "com.inventory.stock-reserved",
    "topic": "stock-reserved",
    "transform": "{ \"stockId\": data.id }"  // Still works as inline
  }]
}
```

### HTTP Endpoints

No changes to sidecar HTTP endpoints (`/publish`, `/invoke`, `/health`, `/ready`).

### Error Responses

Error responses from transform failures follow existing patterns:
- HTTP 500 with JSON error body
- Error message includes details (file path, parse error)

## See Also

- [Sidecar config schema](../../../components/sidecar/schemas/sidecar-config-v1.schema.json)
- [spec.md](../spec.md) - Feature specification
