# Quickstart: Java Capability Annotations Guidance

**Feature**: 025-java-capability-annotations  
**Created**: 2025-12-30  
**Purpose**: Step-by-step guide to implement and validate the feature changes.

## Prerequisites

- Git repository cloned: `https://github.com/your-org/spas` (or local path: `C:\Source\Spas\spas`)
- Feature branch checked out: `025-java-capability-annotations`
- Java 17+ SDK installed (for Java SDK changes)
- Node.js 20 LTS installed (for CLI changes)
- Maven 3.9+ or Gradle 8+ (for building Java SDK)
- IDE: VS Code with Java and TypeScript extensions (recommended)

---

## Part 1: Update CLI Templates (TypeScript)

### Step 1: Navigate to CLI Directory

```powershell
cd C:\Source\Spas\spas\components\cli\spas-service
```

### Step 2: Update `sdk-patterns.eta`

**File**: `templates/partials/sdk-patterns.eta`

**Change**: Remove `options.addCapability()` from Java `Application.main()` example.

**Before** (lines ~180-200):
```java
public static void main(String[] args) {
    SpasServiceRunner.run(Application.class, args, options -> {
        options.addCapability("{primary-capability}");  // REMOVE THIS LINE
        options.setConsistency(...);
    });
}
```

**After**:
```java
public static void main(String[] args) {
    SpasServiceRunner.run(Application.class, args, options -> {
        // Capabilities are auto-discovered from @SpasCommand, @SpasQuery,
        // and @SpasEvent annotations on your handler methods.
        // No manual registration needed.
        
        options.setConsistency(new Consistency(ConsistencyLevel.ACID, QueryConsistencyLevel.EVENTUAL));
        options.setSecurity(...);
        options.setLicense("MIT");
    });
}
```

### Step 3: Update `workflow-phases.eta`

**File**: `templates/partials/workflow-phases.eta`

**Change 1**: Update Java guidance in Phase 3 (line ~281):
```java
// BEFORE:
options.addCapability("{primary-capability}");

// AFTER (remove the line entirely; add comment):
// Capabilities auto-discovered from @SpasCommand, @SpasQuery, @SpasEvent annotations
```

**Change 2**: Update Phase 3 exit criteria (line ~304):
```text
// BEFORE:
- At least one capability added via `AddCapability()` or `addCapability()`

// AFTER:
- Service identity configured via @SpasService annotation
- At least one command, query, or event handler annotated with @SpasCommand,
  @SpasQuery, or @SpasEvent (capabilities auto-discovered from annotations)
```

### Step 4: Verify Template Changes

```powershell
# Search for remaining addCapability references (should only find .NET examples)
Select-String -Path "templates\partials\*.eta" -Pattern "addCapability"

# Expected output:
# - sdk-patterns.eta (line ~586): .NET example (AddCapability for C#) ✅
# - workflow-phases.eta (line ~248): .NET example (AddCapability for C#) ✅
# - NO matches in Java-specific sections ✅
```

### Step 5: Build and Test CLI

```powershell
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

**Expected**: All tests pass; no errors related to template changes.

---

## Part 2: Deprecate Java SDK Methods

### Step 6: Navigate to Java SDK Directory

```powershell
cd C:\Source\Spas\spas\components\sdk\java
```

### Step 7: Deprecate `SpasServiceOptions.addCapability()`

**File**: `spas-sdk-spring/src/main/java/io/spas/sdk/spring/SpasServiceOptions.java`

**Change**: Add `@Deprecated` annotation and Javadoc to `addCapability()` method (line ~77):

```java
/**
 * Adds a capability to the service metadata.
 * 
 * @param capability the capability identifier (e.g., "order-management")
 * @deprecated Use {@link io.spas.sdk.metadata.annotations.SpasCommand},
 *             {@link io.spas.sdk.metadata.annotations.SpasQuery}, or
 *             {@link io.spas.sdk.metadata.annotations.SpasEvent} annotations
 *             on handler methods instead. Capabilities are automatically
 *             discovered from annotated methods.
 *             This method will be removed in version 2.0.0.
 * @see io.spas.sdk.metadata.annotations.SpasCommand
 * @see io.spas.sdk.metadata.annotations.SpasQuery
 * @see io.spas.sdk.metadata.annotations.SpasEvent
 */
@Deprecated(since = "1.1.0", forRemoval = true)
public void addCapability(String capability) {
    if (capability == null || capability.isBlank()) {
        return;
    }
    capabilities.add(capability);
}
```

### Step 8: Deprecate `ServiceIdentityBuilder.addCapability()`

**File**: `spas-sdk-metadata/src/main/java/io/spas/sdk/metadata/builders/ServiceIdentityBuilder.java`

**Change**: Add `@Deprecated` annotation and Javadoc to `addCapability()` method (line ~49):

```java
/**
 * Adds a capability to the service identity.
 * 
 * @param capability the capability identifier (e.g., "order-management")
 * @return this builder for method chaining
 * @deprecated Capabilities are automatically discovered from
 *             {@link io.spas.sdk.metadata.annotations.SpasCommand},
 *             {@link io.spas.sdk.metadata.annotations.SpasQuery}, and
 *             {@link io.spas.sdk.metadata.annotations.SpasEvent} annotations.
 *             Manual capability registration is no longer necessary.
 *             This method will be removed in version 2.0.0.
 * @see io.spas.sdk.metadata.annotations.SpasCommand
 * @see io.spas.sdk.metadata.annotations.SpasQuery
 * @see io.spas.sdk.metadata.annotations.SpasEvent
 */
@Deprecated(since = "1.1.0", forRemoval = true)
public ServiceIdentityBuilder addCapability(String capability) {
    this.capabilities.add(capability);
    return this;
}
```

### Step 9: Build Java SDK

```powershell
# From components/sdk/java directory
mvn clean install -DskipTests

# Or with tests (will show deprecation warnings):
mvn clean install
```

**Expected Output**:
- Build succeeds
- Deprecation warnings appear for existing tests that use `addCapability()`
- Example warning:
  ```
  [WARNING] SpasServiceOptionsTest.java:[line]: addCapability(String) in SpasServiceOptions has been deprecated and marked for removal
  ```

### Step 10: Verify Deprecation

```powershell
# Search for @Deprecated annotations
Select-String -Path "spas-sdk-*/src/main/java/**/*.java" -Pattern "@Deprecated.*forRemoval.*true"

# Expected: 2 matches
# - SpasServiceOptions.java (addCapability method)
# - ServiceIdentityBuilder.java (addCapability method)
```

---

## Part 3: Update SDK Documentation

### Step 11: Update `spas-sdk-metadata/README.md`

**File**: `spas-sdk-metadata/README.md`

**Add Section** (after "Getting Started"):

```markdown
## Declaring Capabilities

Capabilities are automatically discovered from annotations on your handler methods:

\```java
@RestController
@RequestMapping("/orders")
public class OrderController {
    
    @SpasCommand(name = "CreateOrder", version = "1.0.0")
    @PostMapping
    public OrderResponse create(@RequestBody CreateOrderRequest request) {
        // Implementation
    }
    
    @SpasQuery(name = "GetOrder", version = "1.0.0")
    @GetMapping("/{id}")
    public OrderResponse getById(@PathVariable String id) {
        // Implementation
    }
}
\```

The SDK metadata extractor will automatically register:
- `order-management` capability (derived from command/query presence)
- Command: `CreateOrder`
- Query: `GetOrder`

No manual capability registration is required.

### Migration Note

If your service uses `options.addCapability()`, replace it with annotations:

\```java
// OLD (deprecated):
SpasServiceRunner.run(Application.class, args, options -> {
    options.addCapability("order-management");  // ❌ Deprecated
});

// NEW (recommended):
// Just annotate your handlers; capabilities auto-discovered
@SpasCommand(name = "CreateOrder", version = "1.0.0")
public OrderResponse create(...) { ... }
\```

The `addCapability()` method is deprecated as of version 1.1.0 and will be removed in version 2.0.0.
```

### Step 12: Update `spas-sdk-spring/README.md`

**File**: `spas-sdk-spring/README.md`

**Update Section**: "Configuration" (find existing `addCapability()` examples and add deprecation note):

```markdown
## Configuration

### Service Identity

\```java
SpasServiceRunner.run(Application.class, args, options -> {
    // Note: addCapability() is deprecated as of v1.1.0
    // Use @SpasCommand, @SpasQuery, @SpasEvent annotations instead
    
    options.setConsistency(...);
    options.setSecurity(...);
});
\```

See [spas-sdk-metadata README](../spas-sdk-metadata/README.md#declaring-capabilities) for annotation-based capability declaration.
```

### Step 13: Update Root `README.md`

**File**: `components/sdk/java/README.md`

**Update Section**: "Quick Start" (ensure annotation-based approach shown):

```markdown
## Quick Start

\```java
@SpringBootApplication
@SpasService(
    id = "order-service",
    name = "Order Service",
    boundedContext = "orders",
    version = "1.0.0"
)
public class Application {
    public static void main(String[] args) {
        SpasServiceRunner.run(Application.class, args);
    }
}

@RestController
@RequestMapping("/orders")
public class OrderController {
    
    @SpasCommand(name = "CreateOrder", version = "1.0.0")
    @PostMapping
    public OrderResponse create(@RequestBody CreateOrderRequest request) {
        // Capabilities auto-discovered from this annotation
    }
}
\```
```

---

## Part 4: Validation

### Step 14: Test CLI Template Generation

```powershell
cd C:\Source\Spas\spas\components\cli\spas-service

# Generate a test workspace
node dist/index.js init test-java-service

# Inspect generated agent file
cat test-java-service\.github\agents\spas.service.agent.md | Select-String "addCapability"

# Expected: NO matches (or only in .NET examples with "AddCapability")
```

### Step 15: Test Java SDK Deprecation Warnings

```powershell
cd C:\Source\Spas\spas\components\sdk\java

# Run existing tests (should show deprecation warnings)
mvn test -Dtest=ServiceIdentityBuilderTest

# Expected output:
# [WARNING] ... addCapability(String) ... has been deprecated
```

### Step 16: Run Full SDK Test Suite

```powershell
cd C:\Source\Spas\spas\components\sdk\java

mvn clean verify

# Expected:
# - All tests pass
# - Deprecation warnings visible
# - No compilation errors
```

### Step 17: Verify Success Criteria

**SC-001**: Zero `addCapability()` in generated Java scaffolds
```powershell
cd test-java-service
Select-String -Recurse -Pattern "addCapability" .

# Expected: 0 matches in Java files
```

**SC-002**: 100% annotation-based SDK docs
```powershell
cd C:\Source\Spas\spas\components\sdk\java
Select-String -Path "**/README.md" -Pattern "addCapability" | Where-Object { $_ -notmatch "deprecated|OLD|Migration" }

# Expected: 0 matches (except in migration notes showing "before" examples)
```

**SC-003**: Migration within 10 minutes
- Follow migration note in `spas-sdk-metadata/README.md`
- Convert sample service from `addCapability()` to annotations
- Time the process (should be < 10 minutes)

**SC-004**: No impact on non-Java scaffolds
```powershell
cd C:\Source\Spas\spas\components\cli\spas-service

# Generate .NET workspace
node dist/index.js init test-dotnet-service

# Verify .NET examples unchanged
cat test-dotnet-service\.github\agents\spas.service.agent.md | Select-String "AddCapability"

# Expected: .NET examples still show AddCapability() method
```

---

## Part 5: Commit and Document

### Step 18: Stage Changes

```powershell
cd C:\Source\Spas\spas

git add components/cli/spas-service/templates/
git add components/sdk/java/spas-sdk-metadata/
git add components/sdk/java/spas-sdk-spring/
git add components/sdk/java/README.md
git add specs/025-java-capability-annotations/
```

### Step 19: Commit with Descriptive Message

```powershell
git commit -m "feat(java): deprecate addCapability() and promote annotations

- Deprecate SpasServiceOptions.addCapability() (removal in v2.0.0)
- Deprecate ServiceIdentityBuilder.addCapability() (removal in v2.0.0)
- Update CLI templates to remove addCapability() from Java examples
- Add capability declaration sections to SDK READMEs
- Include migration notes for existing services

Closes #025-java-capability-annotations"
```

### Step 20: Push to Remote

```powershell
git push origin 025-java-capability-annotations
```

---

## Troubleshooting

### Issue: Template changes not reflected in generated output

**Solution**: Rebuild CLI and clear any cached templates:
```powershell
cd components/cli/spas-service
npm run build
rm -r -Force dist
npm run build
```

### Issue: Deprecation warnings not appearing

**Solution**: Ensure Maven/Gradle is configured to show deprecation warnings:
```powershell
# Maven: Add to pom.xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <compilerArgs>
            <arg>-Xlint:deprecation</arg>
        </compilerArgs>
    </configuration>
</plugin>

# Or run with flag:
mvn clean compile -Xlint:deprecation
```

### Issue: Tests fail after deprecation

**Solution**: Tests using `addCapability()` are expected to show warnings but should still pass. If tests fail, check for:
- Syntax errors in `@Deprecated` annotation
- Missing `import` statements for annotation types
- Typos in Javadoc `@link` tags

---

## Next Steps

After completing this quickstart:

1. **Create PR**: Open pull request for feature branch
2. **Code Review**: Request review from SDK and CLI maintainers
3. **Update CHANGELOG**: Add deprecation notice to `components/sdk/java/CHANGELOG.md`
4. **Documentation Site**: Update public docs (if applicable) to reference annotation approach
5. **Announce**: Notify team/community of deprecation timeline

**Timeline**:
- **v1.1.0 Release** (current sprint): Deprecation warnings active
- **v1.x Releases** (next 2-3 sprints): Method remains available (deprecated)
- **v2.0.0 Release** (future major version): Method removed

---

## Summary

You have successfully:
- ✅ Updated CLI templates to remove `addCapability()` from Java examples
- ✅ Deprecated SDK methods with clear Javadoc and `@Deprecated` annotations
- ✅ Added capability declaration sections to SDK READMEs
- ✅ Verified success criteria (SC-001 through SC-004)
- ✅ Committed and pushed changes to feature branch

The Java SDK now guides developers toward annotation-based capability declaration exclusively, with a clear deprecation timeline for programmatic methods.
