# Research: .NET SDK Controller Metadata Support

**Feature**: 026-dotnet-controller-support  
**Phase**: 0 (Research & Analysis)  
**Date**: 2025-12-30

## Overview

This document captures technical research and decisions for extending .NET SDK metadata generation to support ASP.NET Core MVC Controllers alongside existing Minimal API support.

---

## 1. ASP.NET Core Controller Route Resolution

### Question
How does ASP.NET Core combine class-level `[Route]` and method-level HTTP verb attributes to create final route templates?

### Research Findings

**Route Template Composition**:
```csharp
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    [HttpGet]                    // → /api/orders
    [HttpGet("{id}")]           // → /api/orders/{id}
    [HttpPost("batch")]         // → /api/orders/batch
}
```

**Resolution Rules**:
1. If method attribute has absolute path (starts with `/` or `~/`), class route is ignored
2. Otherwise, method route is appended to class route
3. Route tokens are resolved:
   - `[controller]` → controller name without "Controller" suffix (kebab-case)
   - `[action]` → method name (kebab-case)
4. `ControllerActionDescriptor.AttributeRouteInfo.Template` contains the **fully resolved** template

**ASP.NET Core Code References**:
- `AttributeRouteInfo.Template`: Property containing final resolved route
- `RoutePatternFactory`: Handles route parsing and token replacement
- MVC automatically resolves tokens during endpoint discovery

### Decision

**Use `ControllerActionDescriptor.AttributeRouteInfo.Template` directly** - it contains the fully resolved route with tokens already replaced. No manual token resolution needed.

**Rationale**: ASP.NET Core's routing system has already done the work. Reimplementing token resolution would duplicate framework logic and risk inconsistencies.

**Alternatives Considered**:
- Manual token replacement: Rejected (error-prone, duplicates framework logic)
- Parsing `[Route]` attributes directly: Rejected (ignores framework's resolution logic)

---

## 2. IActionDescriptorCollectionProvider Access

### Question
How do we access `IActionDescriptorCollectionProvider` during offline metadata generation (when WebApplication is built but not running)?

### Research Findings

**Service Provider Access**:
```csharp
public static ServiceContracts DiscoverSpasMetadata(this WebApplication app)
{
    var actionDescriptorProvider = app.Services.GetService<IActionDescriptorCollectionProvider>();
    
    if (actionDescriptorProvider != null)
    {
        foreach (var descriptor in actionDescriptorProvider.ActionDescriptors.Items)
        {
            if (descriptor is ControllerActionDescriptor controllerAction)
            {
                // Process controller action
            }
        }
    }
}
```

**Key Points**:
- `IActionDescriptorCollectionProvider` is registered when `AddControllers()` or `AddMvc()` is called
- Returns `null` if Controllers are not registered (graceful degradation)
- Available immediately after `builder.Build()` - no need to start Kestrel
- Collection is populated during DI container build phase

**Verification**: Tested with existing `order-service` example - provider is available in offline mode.

### Decision

**Access `IActionDescriptorCollectionProvider` from `app.Services` with null check** for graceful degradation when Controllers are not registered.

**Rationale**: Enables hybrid scenarios (Minimal API only, Controllers only, or both). No error if Controllers aren't used.

**Alternatives Considered**:
- Require Controllers registration: Rejected (breaks Minimal API-only services)
- Use reflection to find controller types: Rejected (ignores routing configuration, misses attribute routes)

---

## 3. Schema Inference Reuse from Feature 023

### Question
Can we reuse feature 023's schema inference logic for controller actions?

### Research Findings

**Feature 023 Approach** (Minimal API):
```csharp
// Extracts request body type from handler parameter
var requestBodyType = ExtractRequestBodyParameterType(endpoint);

// Endpoint handler: (CreateOrderRequest request) => { }
// Inferred type: CreateOrderRequest
```

**Controller Equivalent**:
```csharp
[HttpPost]
public IActionResult CreateOrder([FromBody] CreateOrderRequest request)
{
    // Controller action
}
```

**Mapping**:
| Minimal API | Controller | Extraction Method |
|-------------|-----------|-------------------|
| Delegate parameter | `ParameterInfo` from `MethodInfo.GetParameters()` | Filter by `[FromBody]` or first complex type |
| Delegate return type | `MethodInfo.ReturnType` | Unwrap `ActionResult<T>`, `Task<T>` |
| Schema generation | `SchemaGenerator.GenerateSchemaAsync(Type)` | Same method, same type input |

**Controller-Specific Handling**:
- Look for `[FromBody]` attribute on parameters
- If no `[FromBody]`, use first complex (non-primitive) parameter
- Unwrap common controller return types:
  - `ActionResult<T>` → `T`
  - `Task<IActionResult>` → inspect for `T`
  - `IActionResult` → no schema (unknown type)

### Decision

**Reuse existing schema inference logic** from feature 023 with minimal adaptation for controller-specific parameter extraction.

**Implementation**:
```csharp
private static Type? ExtractRequestBodyTypeFromController(ControllerActionDescriptor action)
{
    var parameters = action.MethodInfo.GetParameters();
    
    // Prefer [FromBody] parameter
    var fromBodyParam = parameters.FirstOrDefault(p => p.GetCustomAttribute<FromBodyAttribute>() != null);
    if (fromBodyParam != null) return fromBodyParam.ParameterType;
    
    // Fall back to first complex type
    return parameters.FirstOrDefault(p => !p.ParameterType.IsPrimitive && 
                                          p.ParameterType != typeof(string))?.ParameterType;
}
```

**Rationale**: Avoids code duplication, maintains consistency between Minimal API and Controller schema generation.

**Alternatives Considered**:
- Separate schema generation logic for controllers: Rejected (unnecessary duplication)
- Require explicit schema paths on controllers: Rejected (inconsistent with Minimal API UX)

---

## 4. Route Token Resolution Strategy

### Question
How are `[controller]` and `[action]` tokens resolved in attribute routes?

### Research Findings

**Token Types**:
```csharp
[Route("api/[controller]")]           // [controller] → "orders" (from OrdersController)
[Route("api/[controller]/[action]")]  // [action] → "create" (from CreateOrder method)
```

**Resolution Behavior**:
- `[controller]`: Controller class name minus "Controller" suffix, converted to kebab-case
- `[action]`: Action method name, converted to kebab-case
- Resolved **before** `AttributeRouteInfo.Template` is populated
- Custom tokens can be added via `IRouteTemplateProvider`

**Discovery Implication**:
Since `ControllerActionDescriptor.AttributeRouteInfo.Template` contains the **already-resolved** template, we don't need to handle token replacement manually.

**Example**:
```csharp
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    [HttpGet("[action]")]  // Before resolution: "[action]"
    public IActionResult GetAll() { }
}

// AttributeRouteInfo.Template value: "api/orders/get-all" (fully resolved)
```

### Decision

**No manual token resolution needed** - consume `AttributeRouteInfo.Template` as-is.

**Rationale**: ASP.NET Core has already done the work. Using the pre-resolved template ensures consistency with runtime behavior.

**Alternatives Considered**:
- Manual token replacement: Rejected (error-prone, unnecessary duplication of framework logic)

---

## 5. Testing Strategy

### Question
How do we ensure both Minimal API and Controller discovery work correctly together without regressions?

### Research Findings

**Test Categories**:

1. **Unit Tests** (Fast, isolated):
   - Controller discovery in isolation
   - Route template extraction
   - Schema inference from controller parameters
   - Produces property extraction
   - Validation logic

2. **Integration Tests** (End-to-end):
   - Mixed service (Minimal API + Controllers)
   - Metadata archive generation
   - Schema file verification
   - Duplicate name detection

3. **Regression Tests** (Existing tests must pass):
   - All existing Minimal API tests (from feature 001, 023)
   - Existing example services (order-service, inventory-service, etc.)

**Test Data Structure**:
```csharp
// Test controller
[Route("api/test")]
public class TestController : ControllerBase
{
    [HttpPost]
    [SpasCommand("CreateTest", "1.0")]
    public IActionResult Create([FromBody] TestRequest request) { }
    
    [HttpGet("{id}")]
    [SpasQuery("GetTest", "1.0")]
    public ActionResult<TestResponse> Get(string id) { }
}
```

**Verification Points**:
- ✅ Controller endpoints discovered
- ✅ Minimal API endpoints still discovered
- ✅ No duplicate names allowed
- ✅ Schemas generated for both sources
- ✅ Metadata structure identical

### Decision

**Three-tier testing approach**:
1. Unit tests for controller-specific logic
2. Integration tests for mixed scenarios
3. Run full existing test suite to catch regressions

**Rationale**: Comprehensive coverage ensures non-breaking extension while validating new functionality.

**Alternatives Considered**:
- Integration tests only: Rejected (slow feedback, hard to debug)
- Skip regression tests: Rejected (violates non-breaking constraint)

---

## 6. Documentation Audit Scope

### Question
What documentation needs updating to reflect controller support?

### Research Findings

**Locations with "Minimal APIs only" or similar restrictions**:

1. **Code Comments**:
   - `components/sdk/dotnet/src/Spas.Sdk.Metadata/Attributes/SpasContractAttributes.cs` (lines 21, 70)
     - Current: "Apply to minimal API endpoints or controller actions"
     - Issue: Claims support before implementation
     - Fix: Update to accurate current state, then update again post-implementation

2. **SDK Documentation**:
   - `components/sdk/dotnet/README.md` (line 84)
     - Current: "**Minimal APIs only** — endpoints must use app.MapPost, app.MapGet, etc.; controller-based routing is not supported"
     - Fix: Update to: "Supports both Minimal APIs and MVC Controllers"

3. **CLI Templates**:
   - `components/cli/spas-service/templates/dotnet/` (if exists)
     - May contain only Minimal API examples
     - Fix: Add controller examples alongside Minimal API

4. **Agent Instructions**:
   - `.github/agents/copilot-instructions.md`
     - May restrict to Minimal API patterns
     - Fix: Update to mention both patterns

5. **Example Services**:
   - `components/sdk/dotnet/examples/SampleService/`
     - Currently Minimal API only
     - Fix: Add controller example alongside existing minimal API endpoints

### Decision

**Systematic documentation update in Phase 6**:
1. Search codebase for "Minimal API only" and "minimal API" mentions
2. Update each location to reflect both patterns
3. Add controller examples to templates and example projects
4. Update agent prompts to include controller guidance

**Rationale**: Ensures consistent developer experience and prevents confusion about supported patterns.

**Alternatives Considered**:
- Update only README: Rejected (incomplete, leaves misleading information in code)
- Update after implementation only: Rejected (spec requires documentation accuracy)

---

## Summary of Key Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Route Resolution | Use `AttributeRouteInfo.Template` directly | Framework has already resolved tokens |
| Service Access | Get `IActionDescriptorCollectionProvider` from `app.Services` with null check | Enables graceful degradation, works offline |
| Schema Inference | Reuse feature 023 logic with controller parameter extraction | Avoids duplication, maintains consistency |
| Token Resolution | No manual resolution needed | Pre-resolved in framework |
| Testing | Three-tier: unit, integration, regression | Comprehensive coverage without regressions |
| Documentation | Systematic audit and update in Phase 6 | Consistent developer experience |

---

## Open Questions

None - all research questions resolved. Ready to proceed to Phase 1 (Design).
