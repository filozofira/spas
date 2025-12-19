# Data Model: Repository Service Enhancements

**Feature**: Repository Service Enhancements  
**Date**: December 19, 2025

## Overview

This enhancement modifies existing data models and API contracts without introducing new entities. The changes focus on endpoint behavior and metadata transformation logic.

## Entity Changes

### ServiceMetadata (Existing - Modified)

**Purpose**: Complete service information with runtime deployment details

**Key Modification**: 
- `schemaVersion` field MUST be set to `"runtime-metadata-v1"` for all services retrieved from repository endpoints
- This corrects the current bug where services show `"design-time-metadata-v1"` after retrieval

```typescript
export interface ServiceMetadata {
  schemaVersion: string; // MUST be "runtime-metadata-v1" for retrieved services
  id: string;
  name: string;
  description: string;
  version: string;
  boundedContext: string;
  capabilities: string[];
  endpoints: Endpoint[];
  events: Event[];
  consistency: Consistency;
  network: Network;
  security: Security;
  license: string;
  runtime?: Runtime; // Added by repository during publish
  publishedAt?: string; // ISO 8601 timestamp, added by repository
}
```

**Business Rules**:
1. When services are stored: preserve original `schemaVersion` from spas.json
2. When services are retrieved: transform `schemaVersion` to `"runtime-metadata-v1"`
3. Runtime fields (runtime?, publishedAt?) are populated by repository service
4. Original design-time metadata preserved in storage for audit purposes

### SearchResults (Existing - Extended Usage)

**Purpose**: Paginated response structure for service lists

**Key Extension**: 
- Now used for both filtered searches AND unfiltered "list all services" endpoint
- Maintains consistent pagination structure across all endpoints

```typescript
export interface SearchResults {
  total: number;      // Total count of all services matching criteria (or all services for unfiltered)
  limit: number;      // Maximum results per page
  offset: number;     // Starting position for pagination
  results: ServiceInfo[]; // Service list with runtime schema version
}
```

**Business Rules**:
1. Unfiltered requests return ALL published services
2. Pagination limits apply to prevent large response payloads
3. Results array contains ServiceInfo with corrected schema versions
4. Total count reflects actual repository contents

### ServiceInfo (Existing - Schema Version Fix)

**Purpose**: Lightweight service representation for list responses

**Key Modification**:
- All ServiceInfo objects MUST have correct runtime schema version when returned from repository

```typescript
export interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  boundedContext: string;
  capabilities: string[];
  publishedAt?: string;
  runtime?: Runtime; // Runtime metadata if available
}
```

**Business Rules**:
1. Derived from ServiceMetadata with runtime schema version applied
2. Contains essential service information for discovery workflows
3. Runtime information included when available from publish process
4. Used consistently across both filtered and unfiltered endpoints

## State Transitions

### Service Discovery Flow

```
1. Client Request
   ├── GET /services (unfiltered) → All Services
   ├── GET /services?capability=X → Filtered by Capability  
   └── GET /services?boundedContext=Y → Filtered by Bounded Context

2. Repository Processing
   ├── Query Storage (apply filters if present)
   ├── Transform Results (fix schema versions)
   └── Apply Pagination

3. Response
   └── SearchResults with corrected ServiceInfo[]
```

### Schema Version Transformation Flow

```
1. Storage State
   └── ServiceMetadata with original schemaVersion (may be "design-time-metadata-v1")

2. Retrieval Processing
   ├── Load from storage
   ├── Apply runtime transformations
   └── Set schemaVersion = "runtime-metadata-v1"

3. Response State
   └── ServiceMetadata/ServiceInfo with corrected schema version
```

## Validation Rules

### Request Validation
- Unfiltered endpoint: No query parameters required
- Filtered endpoint: Either `capability` OR `boundedContext` parameter required
- Pagination: Standard offset/limit validation (existing patterns)

### Response Validation
- All returned services MUST have `schemaVersion: "runtime-metadata-v1"`
- SearchResults structure MUST be consistent across all endpoints
- Runtime fields MUST be populated when available

## Backwards Compatibility

### API Contract Compatibility
- Existing `/services?capability=X` behavior unchanged
- Existing `/services?boundedContext=Y` behavior unchanged  
- New `/services` (no params) behavior follows same response structure
- No breaking changes to existing response formats

### Data Compatibility
- Storage format unchanged (preserves original metadata)
- Only retrieval/transformation logic modified
- Historical service data remains accessible

## Dependencies

### Internal Dependencies
- SearchService: Add getAllServices() method
- RetrievalService: Add schema version transformation logic
- Existing storage interface: No changes required

### External Dependencies
- None - fully internal enhancement to repository service
- Maintains compatibility with existing CLI tools and external consumers

## Performance Considerations

### Query Performance
- Unfiltered queries may return large result sets
- Pagination prevents unbounded response sizes
- Existing SQLite query patterns maintained

### Memory Usage
- Schema version transformation applied during serialization
- No additional memory overhead for storage
- Existing service caching patterns maintained (if any)

### Response Time Targets
- Unfiltered endpoint: <2 seconds for up to 100 services
- Maintain existing performance for filtered endpoints
- Schema version transformation has minimal computational overhead