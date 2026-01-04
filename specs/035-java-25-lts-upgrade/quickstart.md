# Quickstart: Java 25 LTS Upgrade

**Feature**: Java 25 LTS Upgrade  
**Branch**: `035-java-25-lts-upgrade`  
**Prerequisites**: Java 25 JDK installed, Maven 3.8+

## Overview

This guide provides step-by-step instructions to upgrade the SPAS Java SDK and all example services from Java 21 LTS to Java 25 LTS.

**Estimated Time**: 2-3 hours  
**Difficulty**: Low (configuration changes only)

---

## Prerequisites

### 1. Install Java 25 JDK

**Download**:
- Eclipse Temurin: https://adoptium.net/temurin/releases/?version=25
- Oracle JDK: https://www.oracle.com/java/technologies/downloads/#java25

**Verify Installation**:
```bash
java -version
# Expected output: openjdk version "25" or similar
```

**Set JAVA_HOME** (if not already set):
```bash
# Windows (PowerShell)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.1+9"

# Linux/Mac
export JAVA_HOME=/usr/lib/jvm/jdk-25
```

### 2. Verify Maven

```bash
mvn -version
# Maven 3.8+ required
# Should show Java version 25
```

### 3. Capture Baselines (Optional but Recommended)

Record current performance metrics for comparison:

```bash
cd components/sdk/java

# Measure build time
time mvn clean install

# Check artifact sizes
du -sh ~/.m2/repository/io/spas/

# Measure test count
mvn test | grep "Tests run"
```

---

## Phase 1: Upgrade SDK (Priority: P1 - MVP)

### Step 1.1: Update Parent POM

**File**: `components/sdk/java/pom.xml`

**Changes**:
```xml
<!-- Line 33: Update Java version -->
<java.version>25</java.version>

<!-- Lines 40-41: Update Spring Boot version -->
<spring-boot.version>3.4.1</spring-boot.version>

<!-- Line 43: Update Jackson -->
<jackson.version>2.18.2</jackson.version>

<!-- Lines 46-48: Update test dependencies -->
<junit.version>5.11.4</junit.version>
<mockito.version>5.14.2</mockito.version>

<!-- Lines 51-54: Update Maven plugins -->
<maven-compiler-plugin.version>3.13.0</maven-compiler-plugin.version>
<maven-surefire-plugin.version>3.5.2</maven-surefire-plugin.version>
<maven-enforcer-plugin.version>3.5.0</maven-enforcer-plugin.version>
```

### Step 1.2: Build SDK

```bash
cd components/sdk/java

# Clean build
mvn clean compile

# Expected: BUILD SUCCESS (all 6 modules compile)
```

**Troubleshooting**:
- If compilation fails, check `java -version` shows Java 25
- If dependencies fail, run `mvn dependency:resolve` to download new versions
- Check [research.md](research.md) for known compatibility issues

### Step 1.3: Run Tests

```bash
mvn test

# Expected: 100+ tests pass, 0 failures
```

**If tests fail**:
1. Check error messages for deprecated API usage
2. Review stack traces for dependency incompatibilities
3. Refer to FR-015: Prioritize fixing production code over updating tests
4. Document any warnings in a `warnings.md` file (optional)

### Step 1.4: Install SDK

```bash
mvn install

# Expected: All modules installed to ~/.m2/repository/io/spas/
```

### Step 1.5: Verify Java Target

```bash
mvn help:evaluate -Dexpression=maven.compiler.target -q -DforceStdout

# Expected output: 25
```

### Step 1.6: Measure Build Time

```bash
time mvn clean install

# Expected: < 5 minutes (Success Criterion SC-001)
```

**✅ Checkpoint**: SDK builds successfully with Java 25, all tests pass, artifacts in local Maven repo

---

## Phase 2: Upgrade Example Services (Priority: P2)

### Step 2.1: Update Sample Service

**File**: `components/sdk/java/examples/sample-service/pom.xml`

**Changes**:
```xml
<!-- Line ~23: Update Java version -->
<java.version>25</java.version>

<!-- Parent already uses Spring Boot 3.4.1, no change needed if using parent -->
```

**Build**:
```bash
cd components/sdk/java/examples/sample-service
mvn clean package

# Expected: BUILD SUCCESS
```

### Step 2.2: Update Basket Service

**File**: `examples/services/basket-service/pom.xml`

**Changes**:
```xml
<!-- Line ~23: Update Java version -->
<java.version>25</java.version>
```

**Build & Test**:
```bash
cd examples/services/basket-service
mvn clean package

# Generate metadata
mvn spring-boot:run -Dspring-boot.run.arguments="--generate-metadata --output ./metadata"

# Verify archive created
ls -lh metadata/service.metadata.zip

# Expected: archive exists, ~50-100KB
```

### Step 2.3: Update Remaining Services

**Repeat for each service** (can be done in parallel):

1. **Fulfillment Service** - `examples/services/fulfillment-service/pom.xml`
2. **Rental Service** - `examples/services/rental-service/pom.xml`
3. **Inventory Service** - `examples/services/inventory-service/pom.xml`
4. **Order Service** - `examples/services/order-service/pom.xml`
5. **Product Service** - `examples/services/product-service/pom.xml`
6. **Subscription Service** - `examples/services/subscription-service/pom.xml`

**Pattern**:
```bash
cd examples/services/{service-name}

# Edit pom.xml: java.version=25
# Build
mvn clean package

# Test startup (optional spot-check)
mvn spring-boot:run &
# Wait 10 seconds
curl http://localhost:8080/actuator/health
# Kill process
```

**✅ Checkpoint**: All 8 services build successfully, metadata generates correctly

---

## Phase 3: Update Docker Images (Priority: P4)

### Step 3.1: Update Service Dockerfiles

**For each service**, update Dockerfile:

**Build Stage** (find line with `FROM maven:...`):
```dockerfile
# Change from:
FROM maven:3.9-eclipse-temurin-21-alpine AS build

# Change to:
FROM maven:3.9-eclipse-temurin-25-alpine AS build
```

**Runtime Stage** (find line with `FROM eclipse-temurin:...`):
```dockerfile
# Change from:
FROM eclipse-temurin:21-jre-alpine

# Change to:
FROM eclipse-temurin:25-jre-alpine
```

**Services to update**:
1. `examples/services/basket-service/Dockerfile`
2. `examples/services/fulfillment-service/Dockerfile`
3. `examples/services/rental-service/Dockerfile`
4. `examples/services/inventory-service/Dockerfile`
5. `examples/services/order-service/Dockerfile`
6. `examples/services/product-service/Dockerfile`
7. `examples/services/subscription-service/Dockerfile`

**Other Dockerfiles** (if they exist and use Java):
- `components/repository/Dockerfile`
- `examples/gateways/api-gateway/Dockerfile` (if Java-based)
- Prototypes in `prototypes/spas-sidecar-prototype/` (optional, may be stale)

### Step 3.2: Test Docker Build (Optional Spot-Check)

```bash
cd examples/services/basket-service

docker build -t basket-service:java25 .

# Expected: BUILD SUCCESS

# Test run (optional)
docker run -p 8080:8080 basket-service:java25
# Verify startup time
```

**✅ Checkpoint**: All Dockerfiles updated, spot-check builds succeed

---

## Phase 4: Update CLI Templates (Priority: P4)

### Step 4.1: Update Template Files

**Source Templates** (edit these first):

1. **`components/cli/spas-service/templates/readme.eta`**
   - Find: `Java (JDK 21+ with Maven)`
   - Replace: `Java (JDK 25+ with Maven)`

2. **`components/cli/spas-service/templates/partials/workflow-phases.eta`**
   - Find: `<!-- Use your installed JDK version (21+ required) -->`
   - Replace: `<!-- Use your installed JDK version (25+ required) -->`
   - Find: `<java.version>21</java.version>`
   - Replace: `<java.version>25</java.version>`

3. **`components/cli/spas-service/templates/partials/sdk-patterns.eta`**
   - Find: `<!-- Use your installed JDK version (21+ required) -->`
   - Replace: `<!-- Use your installed JDK version (25+ required) -->`
   - Find: `<java.version>21</java.version>`
   - Replace: `<java.version>25</java.version>`

4. **`components/cli/spas-service/templates/partials/error-handling.eta`**
   - Find: `Missing Java 21+ installation`
   - Replace: `Missing Java 25+ installation`

**Dist Templates** (if they exist, update the same patterns):
- `components/cli/spas-service/dist/templates/readme.eta`
- `components/cli/spas-service/dist/templates/partials/workflow-phases.eta`
- `components/cli/spas-service/dist/templates/partials/sdk-patterns.eta`
- `components/cli/spas-service/dist/templates/partials/error-handling.eta`

### Step 4.2: Rebuild CLI Tool (If Needed)

```bash
cd components/cli/spas-service

# If package.json has a build script
npm run build

# Or if dist/ needs regeneration
npm run dist
```

### Step 4.3: Test CLI Generation

```bash
# Generate test service
spas-service init test-java25-service

# Verify generated pom.xml
grep "java.version" test-java25-service/pom.xml

# Expected: <java.version>25</java.version>

# Verify README
grep "Java" test-java25-service/README.md

# Expected: Java 25+ or JDK 25+

# Clean up
rm -rf test-java25-service
```

**✅ Checkpoint**: CLI generates Java 25 projects correctly

---

## Phase 5: Update Documentation (Priority: P4)

### Step 5.1: Update SDK Documentation

**File**: `components/sdk/java/README.md`

**Changes**:
```markdown
<!-- Line 3: Update badge -->
[![Java](https://img.shields.io/badge/Java-25+-orange)](https://openjdk.org/)

<!-- Find all mentions of "Java 21" and update to "Java 25" -->
- Prerequisites section
- Setup instructions
- Any version requirements
```

**File**: `components/sdk/java/CONTRIBUTING.md`

**Changes**:
- Update Java version requirements
- Update setup instructions if they mention Java 21

### Step 5.2: Update Service READMEs

**For each service README**:

1. `examples/services/basket-service/README.md`
2. `examples/services/fulfillment-service/README.md`
3. `examples/services/rental-service/README.md`
4. `examples/services/inventory-service/README.md`
5. `examples/services/order-service/README.md`
6. `examples/services/product-service/README.md`
7. `examples/services/subscription-service/README.md`

**Pattern**:
```markdown
<!-- Find Prerequisites or Requirements section -->

## Prerequisites

- Java 25+  <!-- Changed from Java 21+ -->
- Maven 3.8+
```

### Step 5.3: Update Root Documentation

**Files to check**:
- `README.md` (root level) - check for Java version mentions
- `components/sdk/README.md` - update if Java version mentioned
- `examples/README.md` - update if Java version mentioned

**Search command**:
```bash
# Find all Java 21 references (excluding historical specs and this spec)
grep -r "Java 21" --include="*.md" --exclude-dir="specs" .
grep -r "JDK 21" --include="*.md" --exclude-dir="specs" .
grep -r "java.version.*21" --include="*.md" --exclude-dir="specs" .
```

**Do NOT update**:
- Historical specs: `specs/001-034/`
- This spec: `specs/035-java-25-lts-upgrade/`

**✅ Checkpoint**: All current documentation mentions Java 25+, no Java 21 references remain

---

## Phase 6: Final Validation (Priority: P3)

### Step 6.1: Full SDK Test Suite

```bash
cd components/sdk/java
mvn clean test

# Expected: All tests pass
# Record: Total test count, execution time
```

### Step 6.2: All Services Build

```bash
# Quick script to build all services
for service in basket fulfillment rental inventory order product subscription; do
  echo "Building ${service}-service..."
  cd examples/services/${service}-service
  mvn clean package -q
  cd ../../..
done

# Expected: All BUILD SUCCESS
```

### Step 6.3: Metadata Generation

```bash
# Test metadata generation for 2-3 services
cd examples/services/basket-service
mvn spring-boot:run -Dspring-boot.run.arguments="--generate-metadata --output ./metadata"

# Verify archive structure
unzip -l metadata/service.metadata.zip

# Expected: spas.json + schema files present
```

### Step 6.4: Performance Validation

**Compare against baselines captured in Prerequisites**:

```bash
# SDK build time
cd components/sdk/java
time mvn clean install
# Expected: < 5 minutes (SC-001)

# Service build time (spot-check one service)
cd examples/services/basket-service
time mvn clean package
# Expected: < 30 seconds (SC-003)

# Artifact sizes
du -sh ~/.m2/repository/io/spas/
# Expected: Within 10% of Java 21 baseline (SC-006)
```

### Step 6.5: Runtime Validation (Optional)

**Start a service and test it**:
```bash
cd examples/services/basket-service
mvn spring-boot:run &

# Wait for startup
sleep 15

# Record startup time from logs
# Expected: Within 10% of Java 21 baseline (SC-007)

# Test endpoint
curl http://localhost:8080/actuator/health

# Expected: {"status":"UP"}

# Kill service
pkill -f basket-service
```

**✅ Checkpoint**: All validation criteria met

---

## Completion Checklist

Use this checklist to track progress:

### SDK (P1 - MVP)
- [ ] Parent POM updated with Java 25 and dependency versions
- [ ] SDK builds successfully
- [ ] All SDK tests pass (100+)
- [ ] SDK installed to local Maven repository
- [ ] Java compiler target verified as 25
- [ ] Build time < 5 minutes

### Services (P2)
- [ ] Sample service POM updated and builds
- [ ] Basket service POM updated and builds
- [ ] Fulfillment service POM updated and builds
- [ ] Rental service POM updated and builds
- [ ] Inventory service POM updated and builds
- [ ] Order service POM updated and builds
- [ ] Product service POM updated and builds
- [ ] Subscription service POM updated and builds
- [ ] Metadata generation tested for 2-3 services

### Docker (P4)
- [ ] Basket service Dockerfile updated
- [ ] Fulfillment service Dockerfile updated
- [ ] Rental service Dockerfile updated
- [ ] Inventory service Dockerfile updated
- [ ] Order service Dockerfile updated
- [ ] Product service Dockerfile updated
- [ ] Subscription service Dockerfile updated
- [ ] Other Dockerfiles checked and updated if needed
- [ ] Spot-check Docker build succeeds

### CLI Templates (P4)
- [ ] readme.eta updated (source)
- [ ] workflow-phases.eta updated (source)
- [ ] sdk-patterns.eta updated (source)
- [ ] error-handling.eta updated (source)
- [ ] Dist templates updated (if applicable)
- [ ] CLI tool rebuilt (if applicable)
- [ ] Test generation produces Java 25 project

### Documentation (P4)
- [ ] SDK README.md badge updated
- [ ] SDK README.md content updated
- [ ] SDK CONTRIBUTING.md updated
- [ ] Basket service README updated
- [ ] Fulfillment service README updated
- [ ] Rental service README updated
- [ ] Inventory service README updated
- [ ] Order service README updated
- [ ] Product service README updated
- [ ] Subscription service README updated
- [ ] Root-level docs checked and updated
- [ ] No Java 21 references in current docs (except specs/001-034)

### Validation (P3)
- [ ] All SDK tests pass
- [ ] All services build successfully
- [ ] Metadata generation works
- [ ] Build time meets success criteria (< 5 min)
- [ ] Service build time acceptable (< 30 sec)
- [ ] Artifact sizes acceptable (within 10%)
- [ ] Startup time acceptable (within 10%)

---

## Troubleshooting

### Build Failures

**Symptom**: `mvn clean compile` fails with compilation errors

**Possible Causes**:
1. JAVA_HOME pointing to Java 21 instead of Java 25
2. Dependency version incompatibility
3. Deprecated API usage

**Solutions**:
```bash
# Verify Java version
java -version
mvn -version

# Clear Maven cache
rm -rf ~/.m2/repository/io/spas/

# Rebuild with debug
mvn clean compile -X
```

### Test Failures

**Symptom**: Some tests fail after upgrade

**Solution** (per FR-015):
1. Prioritize fixing production code for Java 25 compatibility
2. Only update tests if they test implementation details that legitimately changed
3. Document any behavioral changes

**Example**:
```bash
# Run single failing test with details
mvn test -Dtest=FailingTestClass#testMethod

# Check for deprecated API warnings
mvn test 2>&1 | grep -i "deprecated"
```

### Dependency Warnings

**Symptom**: Build succeeds but logs compatibility warnings

**Solution** (per clarifications):
- Use latest available dependency versions
- Document warnings in comments or warnings.md file
- Functionality typically works despite warnings

### Docker Build Fails

**Symptom**: Docker build fails to find Java 25 image

**Solution**:
```bash
# Verify image exists
docker pull eclipse-temurin:25-jre-alpine

# If not available, use full JDK temporarily
FROM eclipse-temurin:25-alpine
# (instead of 25-jre-alpine)
```

### CLI Generation Issues

**Symptom**: Generated projects still show Java 21

**Solution**:
1. Verify template files were actually updated (check file dates)
2. Rebuild CLI tool
3. Clear any CLI cache
4. Test with fresh directory

---

## Next Steps

After completing this quickstart:

1. **Review Changes**: Use `git diff` to review all changes
2. **Run Full Test Suite**: Ensure no regressions
3. **Update Spec Status**: Mark spec.md as "Complete"
4. **Create Completion Doc**: Document results in `COMPLETION.md`
5. **Prepare PR**: Create pull request for review

---

## Quick Reference Commands

```bash
# Full upgrade in one session (after prerequisites)
cd components/sdk/java
# 1. Edit pom.xml (java.version + dependencies)
mvn clean install

# 2. Update all service pom.xml files (java.version=25)
# 3. Build all services
for svc in basket fulfillment rental inventory order product subscription; do
  cd examples/services/${svc}-service && mvn clean package && cd ../../..
done

# 4. Update all Dockerfiles (temurin:25)
# 5. Update CLI templates (Java 25+, java.version=25)
# 6. Update documentation (Java 25+)

# 7. Final validation
cd components/sdk/java && mvn test
```

**Total Time**: ~2-3 hours for complete upgrade
