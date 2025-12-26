# Data Model: SDK Metadata Archive Extraction

**Feature**: 021-sdk-metadata-extraction  
**Created**: 2025-12-26

## Overview

This feature introduces an **offline metadata generation** workflow that produces a **Metadata Archive** (a ZIP file) containing a schema-valid `spas.json` plus JSON Schemas referenced by the contracts declared in that `spas.json`.

The model is language-agnostic; .NET and Java SDKs implement it with different triggers.

## Core Entities

### MetadataArchive

Represents the generated ZIP file.

- `path`: filesystem path where the archive is written
- `entries[]`: list of ZIP entry paths

**Required entries**:
- `spas.json`
- `schemas/endpoints/*.schema.json` (as referenced)
- `schemas/events/*.schema.json` (as referenced)

### SpasMetadata (spas.json)

Design-time service metadata document.

- `schemaVersion`: fixed string `design-time-metadata-v1`
- `id`: service identifier (kebab-case)
- `name`: display name
- `version`: semver string
- `boundedContext`: bounded context identifier
- `description?`: optional
- `capabilities?`: optional array

- `endpoints[]`: list of `EndpointContract`
- `commands[]`: list of `CommandContract`
- `events[]`: list of `EventContract`

- `consistency?`: optional `ConsistencyMetadata`
- `network?`: optional `NetworkMetadata`
- `security?`: optional `SecurityMetadata`
- `license?`: optional

### EndpointContract

Represents an HTTP (or other protocol) interaction point exposed by the service.

- `name`: canonical endpoint name (kebab-case)
- `type`: endpoint type (command/query)
- `protocol`: protocol identifier (e.g., `http`)
- `methodPath`: combined HTTP method + path (e.g., `POST /api/orders`)
- `version`: contract version
- `schemaRef`: relative path to schema entry in archive
- `description?`: optional

### CommandContract

Represents a command contract (may be redundant with endpoint entries depending on SDK semantics; in .NET today it is a separate list).

- `name`: canonical name (kebab-case)
- `version`: semver
- `produces[]`: list of `ProducedEventRef` (may be empty)

### ProducedEventRef

Represents the linkage “this command produces that event”.

- `type`: event type (kebab-case)
- `version`: semver
- `when`: enum string (currently expected `success`)

### EventContract

Represents an event published/subscribed by the service.

- `type`: canonical event type (kebab-case)
- `version`: semver
- `schemaRef`: relative schema path in archive
- `description?`: optional

### SchemaEntry

Represents a JSON schema file inside the archive.

- `path`: string, e.g. `schemas/events/order-created.schema.json`
- `content`: JSON string

## Generation Options

### MetadataGenerationOptions

- `enabled`: boolean (derived from trigger)
- `outputDirectory`: defaults to `./metadata`
- `outputFileName`: fixed `service.metadata.zip`

## Validation Rules

- `spas.json` MUST validate against `components/sdk/schemas/design-time-metadata-v1.schema.json`.
- Every `schemaRef` declared in `spas.json` MUST be present as a ZIP entry.
- Output directory MUST be created if missing.
- Existing archive MUST be overwritten.

## State Transitions

- `Idle` → `Generating` (trigger detected)
- `Generating` → `Succeeded` (archive written)
- `Generating` → `Failed` (validation, discovery, or IO error; non-success exit code)
