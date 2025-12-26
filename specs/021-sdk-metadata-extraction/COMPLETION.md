# Feature 021: SDK Metadata Archive Extraction - Completion Report

## Summary

**Feature**: SDK Metadata Archive Extraction  
**Status**: ✅ COMPLETE (PoC)  
**Date Completed**: 2025-12-26  
**Branch**: `021-sdk-metadata-extraction`

> **Historical note**: This feature documents the transition away from the runtime metadata endpoint at `/_spas/metadata`.
> The supported approach is offline archive generation and archive-based publishing.

### Key Outcomes

1. **Offline Metadata Generation**: Both .NET and Java SDKs can generate complete metadata archives without starting HTTP servers
2. **CLI Triggers**: `.NET: dotnet run -- --generate-metadata`, Java: `-Dspas.generate-metadata=true`
3. **Default Output Convention**: `./metadata/service.metadata.zip` with optional output override
4. **Endpoint Discovery Without Listening**: SDKs populate `endpoints[]` by route discovery without binding ports
5. **Legacy API Removal**: Removed `/_spas/metadata` endpoint and .NET `ComposeToFile` API

---

## Completed User Stories

### US1: Generate Metadata Archive Without Starting Server (Priority: P1) ✅

**Implementation Highlights**:
- .NET `MetadataArchiveGenerator` class with `GenerateAsync()` method
- Java `SpasMetadataArchiveGenerator` class with `generateArchive()` and `writeArchive()` methods
- Process exits immediately after writing archive (no HTTP server startup)
- Archive contains `spas.json` plus schema files under `schemas/events/` and `schemas/endpoints/`

**Key Files**:
- [MetadataArchiveGenerator.cs](../../components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs)
- [SpasMetadataArchiveGenerator.java](../../components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasMetadataArchiveGenerator.java)

### US2: Control Output Location (Priority: P1) ✅

**Implementation Highlights**:
- Default output: `./metadata/service.metadata.zip` relative to project root
- .NET override: `--output <path>` argument
- Java override: `-Dspas.metadata.output=<path>` system property
- Automatic directory creation and overwrite of existing archives

**Key Files**:
- [MetadataGenerationConstants.cs](../../components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataGenerationConstants.cs)
- [MetadataGenerationConstants.java](../../components/sdk/java/spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/generation/MetadataGenerationConstants.java)

### US3: Populate Endpoints Without Listening (Priority: P1) ✅

**Implementation Highlights**:
- .NET uses `WebApplicationDiscoveryExtensions` to read route data sources without calling `app.Run()`
- Java uses Spring mapping annotation reflection without starting embedded server
- `endpoints[]` populated with correct `methodPath`, `protocol`, and `type`
- No listening ports opened; no outbound network calls

**Key Files**:
- [WebApplicationDiscoveryExtensions.cs](../../components/sdk/dotnet/src/Spas.Sdk.Metadata/Extensions/WebApplicationDiscoveryExtensions.cs)
- [SpasAutoConfiguration.java](../../components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasAutoConfiguration.java)

### US4: Schema-Compliant Output (Priority: P1) ✅

**Implementation Highlights**:
- Generated `spas.json` validates against `design-time-metadata-v1.schema.json`
- .NET `SchemaValidator` runs before writing archive; throws actionable error on failure
- Java schema validation in test scope with embedded schema file
- No schema changes required (FR-007 satisfied)

**Key Files**:
- [SchemaValidator.cs](../../components/sdk/dotnet/src/Spas.Sdk.Metadata/Validation/SchemaValidator.cs)
- [SpasJsonSchemaValidationTest.java](../../components/sdk/java/spas-sdk-spring/src/test/java/io/spas/sdk/spring/SpasJsonSchemaValidationTest.java)

### US5: Remove Runtime Metadata Endpoint and ComposeToFile (Priority: P2) ✅

**Implementation Highlights**:
- Removed .NET `ComposeToFile` API from `SpasComposer`
- Removed .NET `MetadataEndpointExtensions` and `MetadataEndpointOptions`
- Removed Java `SpasMetadataController` class
- Updated all example services to use new offline generation approach
- Added system property trigger via `EnvironmentPostProcessor` for Java

**Key Files**:
- [SpasComposer.cs](../../components/sdk/dotnet/src/Spas.Sdk.Metadata/Composition/SpasComposer.cs) (ComposeToFile removed)
- Example services updated: order-service, product-service, subscription-service, inventory-service, basket-service, fulfillment-service

---

## Validation and Test Results

### Test Suite Results

| Test Suite | Tests | Platform | Status |
|------------|-------|----------|--------|
| MetadataArchiveGeneratorTests.cs | 4 | .NET | ✅ PASS |
| WebApplicationDiscoveryExtensionsTests.cs | 3+ | .NET | ✅ PASS |
| SpasComposerTests.cs | Updated | .NET | ✅ PASS |
| SpasMetadataArchiveGeneratorTest.java | 3 | Java | ✅ PASS |
| SpasJsonSchemaValidationTest.java | 1+ | Java | ✅ PASS |
| EndpointDiscoveryTest.java | 1+ | Java | ✅ PASS |

### E2E Verification Results

| Service | Platform | Command | Status |
|---------|----------|---------|--------|
| order-service | .NET | `dotnet run -- --generate-metadata` | ✅ PASS |
| product-service | .NET | `dotnet run -- --generate-metadata` | ✅ PASS |
| subscription-service | .NET | `dotnet run -- --generate-metadata` | ✅ PASS |
| inventory-service | .NET | `dotnet run -- --generate-metadata` | ✅ PASS |
| basket-service | Java | `-Dspas.generate-metadata=true` | ✅ PASS |
| fulfillment-service | Java | `-Dspas.generate-metadata=true` | ✅ PASS |

---

## Requirements Traceability

| Requirement | Description | Status | Validation |
|-------------|-------------|--------|------------|
| FR-001 | .NET trigger via `dotnet run -- --generate-metadata` | ✅ | E2E test |
| FR-002 | Java trigger via `-Dspas.generate-metadata=true` | ✅ | E2E test |
| FR-003 | No HTTP server start during generation | ✅ | Unit test |
| FR-004 | Archive includes spas.json + schemas | ✅ | Unit test |
| FR-005 | Archive matches reference structure | ✅ | Reference entries test |
| FR-006 | spas.json conforms to schema | ✅ | Schema validation test |
| FR-007 | Design-time schema not changed | ✅ | Schema unchanged |
| FR-008 | .NET ComposeToFile removed | ✅ | API removed |
| FR-009 | Runtime metadata endpoint removed | ✅ | Controller removed |
| FR-010 | Default output: `./metadata` | ✅ | Unit test |
| FR-011 | .NET `--output` override | ✅ | Unit test |
| FR-012 | Java output override property | ✅ | Unit test |
| FR-012a | Default filename: `service.metadata.zip` | ✅ | Constants |
| FR-013 | Overwrite existing archives | ✅ | Unit test |
| FR-014 | Exit codes (0 success, non-zero failure) | ✅ | Implementation |
| FR-015 | All example services updated | ✅ | E2E verification |
| FR-016 | Endpoint discovery without listening | ✅ | Unit test |
| FR-017 | No outbound network calls | ✅ | Research doc |
| FR-018 | Identity from code-defined source | ✅ | Implementation |

---

## Key Files Changed

| File | Change Type | Purpose |
|------|-------------|---------|
| `components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataArchiveGenerator.cs` | Added | Offline archive generator |
| `components/sdk/dotnet/src/Spas.Sdk.Metadata/Generation/MetadataGenerationConstants.cs` | Added | Shared constants |
| `components/sdk/dotnet/src/Spas.Sdk.Metadata/Validation/SchemaValidator.cs` | Added/Updated | Schema validation |
| `components/sdk/dotnet/src/Spas.Sdk.Metadata/Composition/SpasComposer.cs` | Modified | ComposeToFile removed |
| `components/sdk/dotnet/src/Spas.Sdk.Metadata/Dev/MetadataEndpointExtensions.cs` | Removed | Endpoint API removed |
| `components/sdk/java/spas-sdk-spring/.../SpasMetadataArchiveGenerator.java` | Added | Java archive generator |
| `components/sdk/java/spas-sdk-spring/.../SpasAutoConfiguration.java` | Modified | Trigger hook added |
| `components/sdk/java/spas-sdk-spring/.../SpasMetadataController.java` | Removed | Endpoint removed |
| `components/sdk/java/spas-sdk-spring/.../SpasProperties.java` | Modified | Endpoint config removed |
| `examples/services/order-service/Program.cs` | Modified | --generate-metadata support |
| `examples/services/product-service/Program.cs` | Modified | --generate-metadata support |
| `examples/services/subscription-service/Program.cs` | Modified | --generate-metadata support |
| `examples/services/inventory-service/Program.cs` | Modified | --generate-metadata support |
| `examples/services/basket-service/README.md` | Modified | Java trigger docs |
| `examples/services/fulfillment-service/README.md` | Modified | Java trigger docs |
| `GROOMING.md` | Modified | Feature supersedes endpoint |

---

## Breaking Changes

| Change | Impact | Migration |
|--------|--------|-----------|
| `ComposeToFile` removed (.NET) | Services using this API | Use `GenerateSpasMetadataArchiveAsync()` instead |
| `/_spas/metadata` endpoint removed | Services exposing endpoint | Use offline generation |
| .NET endpoint helpers removed | Services calling `MapSpasMetadataEndpoint()` | Remove usage; use CLI trigger |

---

## CLI Output Examples

### .NET Generation

```
$ dotnet run -- --generate-metadata

Building...
info: Spas.Sdk.Metadata.Generation.MetadataArchiveGenerator[0]
      Generating SPAS metadata archive...
info: Spas.Sdk.Metadata.Generation.MetadataArchiveGenerator[0]
      Archive written to: ./metadata/service.metadata.zip
```

### Java Generation

```
$ mvn -Dspas.generate-metadata=true spring-boot:run

[INFO] --- spring-boot:3.3.0:run ---
... SPAS metadata archive generated: ./metadata/service.metadata.zip
... Application shutting down (metadata generation complete)
```

### With Output Override (.NET)

```
$ dotnet run -- --generate-metadata --output ./artifacts

info: Spas.Sdk.Metadata.Generation.MetadataArchiveGenerator[0]
      Archive written to: ./artifacts/service.metadata.zip
```

---

## Success Criteria Met

| Criteria | Target | Actual | Status |
|----------|--------|--------|--------|
| SC-001 | Single command, no HTTP server | Verified | ✅ |
| SC-002 | order-service paths match reference | 6/6 entries | ✅ |
| SC-003 | spas.json validates against schema | Passes | ✅ |
| SC-004 | All example services generate archives | 6/6 services | ✅ |
| SC-005 | No runtime endpoint; no ComposeToFile | APIs removed | ✅ |

---

## Reference Archive Structure

The generated archive follows this structure (matching `order-service-1.0.0.zip`):

```
service.metadata.zip
├── spas.json
└── schemas/
    ├── events/
    │   ├── order-confirmed.schema.json
    │   └── order-created.schema.json
    └── endpoints/
        ├── confirm-order.schema.json
        ├── create-order.schema.json
        └── update-shipment-status.schema.json
```

---

## Known Limitations

1. **Java Context Initialization**: Spring context initializes for route discovery but does not open ports
2. **Schema Generation**: Dynamic schema generation may fail for complex types; use explicit `schemaRef` when needed
3. **Exit Behavior**: Java relies on `EnvironmentPostProcessor` to set `spring.main.web-application-type=none`

---

## Backward Compatibility

- ⚠️ **Breaking**: `ComposeToFile` API removed from .NET SDK
- ⚠️ **Breaking**: Runtime `/_spas/metadata` endpoint no longer available
- ✅ **Archive Format**: Generated archives maintain same structure as before
- ✅ **Schema**: `design-time-metadata-v1.schema.json` unchanged
