# Quickstart: Schema Nullable Handling and Transformation Validation

**Feature**: 029-schema-nullable-validation  
**Date**: 2026-01-02

## Prerequisites

- .NET 8+ SDK installed
- Java 17+ and Maven 3.8+ installed
- Node.js 18+ installed
- Access to the SPAS monorepo

## Quick Verification

### 1. .NET SDK Schema Generation

```bash
cd components/sdk/dotnet
dotnet test --filter "FullyQualifiedName~SchemaGeneratorTests"
```

Expected: Tests pass showing schemas with `required` array and nullable types.

### 2. Java SDK Schema Generation

```bash
cd components/sdk/java
mvn test -pl spas-sdk-spring -Dtest=SpasSchemaGeneratorTest
```

Expected: Tests pass showing schemas with `required` array based on `@Nullable` annotations.

### 3. Agent Prompt Generation

```bash
cd components/cli/spas-compose
npm test -- --grep "workflow-phases"
```

Expected: Tests pass confirming Phase 4 includes mandatory field validation instructions.

### 4. Example Service Verification

```bash
cd examples/services/fulfillment-service
mvn -q -DskipTests spring-boot:run -Dspring-boot.run.arguments="--generate-metadata --output ./metadata"
unzip -p metadata/service.metadata.zip spas.json | jq '.endpoints'
```

Expected: Generated schemas show `required` array with non-nullable fields.

## Key Implementation Files

| Component | File | Purpose |
|-----------|------|---------|
| .NET SDK | `components/sdk/dotnet/src/Spas.Sdk.Metadata/Schema/SchemaGenerator.cs` | Configure NJsonSchema for required/nullable |
| Java SDK | `components/sdk/java/spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasSchemaGenerator.java` | Add @Nullable detection |
| Java README | `components/sdk/java/README.md` | Document @Nullable requirement |
| Agent Prompt | `components/cli/spas-compose/src/templates/partials/workflow-phases.eta` | Add Phase 4 validation |
| Example | `examples/services/fulfillment-service/src/main/java/.../dto/CreateShipmentRequest.java` | Demonstrate @Nullable usage |

## Sample Code Changes

### .NET: Class with Mixed Nullability

```csharp
[SpasCommand(Name = "create-order", Schema = "schemas/endpoints/create-order.schema.json")]
public class CreateOrderRequest
{
    public string OrderId { get; set; }      // Required (in required array)
    public string CustomerId { get; set; }   // Required (in required array)
    public string? Notes { get; set; }       // Nullable (type: ["null", "string"])
}
```

### Java: Class with @Nullable

```java
@SpasCommand(name = "create-shipment", schemaRef = "schemas/endpoints/create-shipment.schema.json")
public class CreateShipmentRequest {
    private String referenceId;              // Required (in required array)
    private String customerId;               // Required (in required array)
    
    @Nullable
    private String pickupLocationId;         // Nullable (type: ["null", "string"])
}
```

### Expected Schema Output

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "referenceId": { "type": "string" },
    "customerId": { "type": "string" },
    "pickupLocationId": { "type": ["null", "string"] }
  },
  "required": ["referenceId", "customerId"]
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No `required` array in output | Check NJsonSchema/victools configuration |
| All fields in `required` | Java: Add `@Nullable` to optional fields |
| Wrong field names in `required` | Verify camelCase normalization is working |
| Agent not validating transformations | Regenerate domain with `spas-compose init` |
