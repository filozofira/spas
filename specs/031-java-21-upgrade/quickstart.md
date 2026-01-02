# Quickstart: Java 21 Upgrade

**Feature**: Upgrade Java SDK and example services from Java 17 to Java 21  
**Branch**: `031-java-21-upgrade`  
**Prerequisites**: Java 21 JDK installed, Maven 3.8+

## Overview

This quickstart guides you through upgrading the SPAS Java SDK and all example services to Java 21. The upgrade requires updating POM files and Dockerfiles - no source code changes are needed due to Java's backward compatibility.

## Prerequisites

1. **Install Java 21 JDK**:
   ```powershell
   # Verify installation
   java -version
   # Should show: openjdk version "21" or "21.x.x"
   ```

2. **Verify Maven**:
   ```powershell
   mvn -version
   # Should show: Apache Maven 3.8.x or higher
   # Should show: Java version: 21.x.x
   ```

## Upgrade Steps

### Phase 1: Upgrade SDK

1. **Update SDK Parent POM**:
   
   Edit `components/sdk/java/pom.xml`:
   ```xml
   <properties>
       <!-- Java version -->
       <java.version>21</java.version>
   ```

2. **Build and Install SDK**:
   ```powershell
   cd components/sdk/java
   mvn clean install
   ```

   **Expected Output**: 
   - BUILD SUCCESS
   - All 100+ tests pass
   - Artifacts installed to local Maven repo

3. **Verify SDK**:
   ```powershell
   # Check that Java 21 was used
   mvn help:evaluate -Dexpression=maven.compiler.target -q -DforceStdout
   # Should output: 21
   ```

### Phase 2: Upgrade Example Services

For each service (basket-service, rental-service, fulfillment-service):

1. **Update Service POM**:
   
   Edit `examples/services/{service-name}/pom.xml`:
   ```xml
   <properties>
       <java.version>21</java.version>
   ```

2. **Build Service**:
   ```powershell
   cd examples/services/{service-name}
   mvn clean package
   ```

3. **Verify Metadata Generation**:
   ```powershell
   mvn spring-boot:run -Dspring-boot.run.arguments="--generate-metadata --output ./metadata"
   ```

   **Expected Output**:
   - Metadata archive created at `./metadata/service.metadata.zip`
   - No errors during generation

### Phase 3: Upgrade Sample Service

1. **Update Sample Service POM**:
   
   Edit `components/sdk/java/examples/sample-service/pom.xml`:
   ```xml
   <properties>
       <java.version>21</java.version>
   ```

2. **Build**:
   ```powershell
   cd components/sdk/java/examples/sample-service
   mvn clean package
   ```

### Phase 4: Update Docker Images

For each service with a Dockerfile:

1. **Update Dockerfile**:
   
   Change base images in `examples/services/{service-name}/Dockerfile`:
   ```dockerfile
   # Build stage
   FROM maven:3.9-eclipse-temurin-21-alpine AS build
   
   # Runtime stage
   FROM eclipse-temurin:21-alpine
   ```

2. **Test Docker Build** (optional but recommended):
   ```powershell
   cd examples/services/{service-name}
   docker build -t {service-name}:java21 .
   ```

3. **Verify Container** (optional):
   ```powershell
   docker run --rm {service-name}:java21 java -version
   # Should output: openjdk version "21.x.x"
   ```

### Phase 5: Update Documentation

1. **Find Documentation References**:
   ```powershell
   # Search for Java 17 references (excluding historical specs)
   git grep -n "Java 17" -- "*.md" ":(exclude)specs/0[0-2][0-9]-*" ":(exclude)specs/030-*"
   ```

2. **Update Found Files**:
   
   For each README.md, CONTRIBUTING.md, or other documentation:
   - Change "Java 17" → "Java 21" in system requirements
   - Update "java.version=17" → "java.version=21" in examples
   - Update "temurin:17" → "temurin:21" in Docker instructions

3. **Common Files to Update**:
   - `README.md` (repository root)
   - `components/sdk/java/README.md`
   - `components/sdk/java/CONTRIBUTING.md`
   - `examples/services/basket-service/README.md`
   - `examples/services/rental-service/README.md`
   - `examples/services/fulfillment-service/README.md`

   **Note**: Do NOT update historical spec documents (specs/001-xxx through specs/030-xxx)

4. **Update CLI Templates**:
   ```powershell
   # Find CLI template files with Java 17 references
   git grep -n "Java 17" -- "templates/**" "*.eta" ".github/agents/**"
   ```

   Update found template files (commonly in `templates/partials/sdk-patterns.eta`):
   - Change `<java.version>17</java.version>` → `<java.version>21</java.version>`
   - Update any agent prompt instructions referencing Java 17
   - Update any generated documentation templates

5. **Verify CLI Generation** (optional):
   ```powershell
   # Test that new services generate with Java 21
   # (if spas-service CLI is available)
   spas-service init test-service-java21
   cat test-service-java21/pom.xml | Select-String "java.version"
   # Should show: <java.version>21</java.version>
   ```

## Verification Checklist

After completing all phases:

- [ ] SDK builds successfully with `mvn clean install`
- [ ] All SDK tests pass (100+ tests)
- [ ] Sample service builds successfully
- [ ] basket-service builds and generates metadata
- [ ] rental-service builds and generates metadata
- [ ] fulfillment-service builds and generates metadata
- [ ] Docker images build successfully (if tested)
- [ ] All services start without errors
- [ ] Documentation updated to reference Java 21 (excluding historical specs)
- [ ] CLI templates updated to generate Java 21 projects

## Performance Baseline

Record build times to ensure no regression:

```powershell
# Measure SDK build time
Measure-Command { mvn clean install -DskipTests }

# Compare with Java 17 baseline
# Expected: Within ±5% of previous build time
```

## Troubleshooting

### Error: "unsupported class file major version 65"

**Cause**: Trying to run Java 21 bytecode on Java 17 JVM  
**Solution**: Ensure Java 21 is the active JDK (`java -version`)

### Error: "invalid target release: 21"

**Cause**: Maven Compiler Plugin doesn't recognize Java 21  
**Solution**: Update `maven-compiler-plugin` to 3.12.1 or higher in POM

### Tests Fail After Upgrade

**Cause**: Rare incompatibility or environmental issue  
**Solution**: 
1. Check test logs for specific failures
2. Verify no code relies on Java 17-specific behavior
3. Clean build: `mvn clean verify`

### Docker Build Fails

**Cause**: Base image not found or network issue  
**Solution**: 
1. Verify image name: `eclipse-temurin:21-alpine`
2. Pull manually: `docker pull eclipse-temurin:21-alpine`
3. Check Docker Hub for image availability

## Rollback

If issues arise, revert POMs and Dockerfiles:

```powershell
# Revert changes
git restore components/sdk/java/pom.xml
git restore examples/services/*/pom.xml
git restore examples/services/*/Dockerfile

# Rebuild with Java 17
cd components/sdk/java
mvn clean install
```

## Files Modified

### SDK
- `components/sdk/java/pom.xml` - Parent POM java.version

### Example Services  
- `examples/services/basket-service/pom.xml` - Service java.version
- `examples/services/basket-service/Dockerfile` - Base images
- `examples/services/rental-service/pom.xml` - Service java.version
- `examples/services/rental-service/Dockerfile` - Base images
- `examples/services/fulfillment-service/pom.xml` - Service java.version
- `examples/services/fulfillment-service/Dockerfile` - Base images

### Sample Service
- `components/sdk/java/examples/sample-service/pom.xml` - Service java.version

## Next Steps

After successful upgrade:

1. Commit changes to `031-java-21-upgrade` branch
2. Run full CI/CD pipeline (if configured)
3. Update documentation to reference Java 21
4. Consider using Java 21 features in new code:
   - Virtual threads for concurrency
   - Pattern matching for cleaner conditionals
   - Sequenced collections for ordered data structures

## References

- [Java 21 Release Notes](https://jdk.java.net/21/release-notes)
- [Maven Compiler Plugin](https://maven.apache.org/plugins/maven-compiler-plugin/)
- [Spring Boot Java 21 Support](https://spring.io/blog/2023/09/20/spring-boot-3-2-0-rc1-available-now)
- [research.md](research.md) - Detailed compatibility analysis
