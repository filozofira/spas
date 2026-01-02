# Research: Java 21 Upgrade

**Phase**: 0 - Research & Decision Documentation
**Date**: January 2, 2026

## Overview

This document captures research findings for upgrading the SPAS Java SDK and example services from Java 17 to Java 21. Since this is a version upgrade within a stable LTS migration path, research focuses on compatibility verification rather than technology selection.

## Research Questions

### 1. Java 17 to 21 Compatibility

**Question**: Are there any breaking changes between Java 17 LTS and Java 21 LTS that would affect the SPAS SDK?

**Decision**: Java 21 maintains backward compatibility with Java 17.

**Rationale**:
- Java 21 is an LTS (Long-Term Support) release following Java 17 LTS
- Oracle's compatibility policy ensures bytecode and API compatibility within the same major version
- All Java 17 code compiles and runs on Java 21 without modification
- No APIs used by SPAS SDK were removed or significantly changed

**Alternatives Considered**:
- **Stay on Java 17**: Rejected - missing performance improvements, security patches, and modern language features
- **Jump to Java 22/23**: Rejected - non-LTS releases, less stability for framework code

**Key Java 21 Features Available** (opt-in for future use):
- Virtual Threads (JEP 444) - improve concurrency for high-throughput services
- Sequenced Collections (JEP 431) - better collection APIs
- Pattern Matching for switch (JEP 441) - cleaner conditional logic
- String Templates (Preview) - safer string composition

**Implementation Notes**:
- Change `<java.version>17</java.version>` to `<java.version>21</java.version>` in POMs
- No code changes required for compatibility
- Existing tests should pass without modification

---

### 2. Maven and Spring Boot Compatibility

**Question**: Do Maven 3.8+ and Spring Boot 3.x support Java 21?

**Decision**: Both are fully compatible with Java 21.

**Rationale**:
- **Maven 3.8+**: Officially supports Java 21 (tested up to Java 21 in Maven 3.9.x)
- **Spring Boot 3.2+**: Full Java 21 support since 3.2.0 release (November 2023)
- **Spring Boot 3.4.1**: Currently used in example services, has comprehensive Java 21 support

**Verification**:
- Maven Compiler Plugin 3.12.1+ supports Java 21 target
- Spring Boot 3.4.1 tested and certified on Java 21
- No configuration changes needed beyond java.version property

**Implementation Notes**:
- Maven enforcer plugin rules may need update if they check Java version
- No Spring Boot configuration changes required

---

### 3. Docker Base Image Selection

**Question**: What Docker base image should be used for Java 21?

**Decision**: `eclipse-temurin:21-alpine` for runtime, `maven:3.9-eclipse-temurin-21-alpine` for build stages

**Rationale**:
- **Eclipse Temurin**: OpenJDK builds by Adoptium (formerly AdoptOpenJDK), industry standard
- **Alpine variant**: Smaller image size (~150MB vs ~300MB for standard)
- **Official images**: Maintained by Docker and Adoptium, security updates guaranteed
- **Maven image**: Pre-configured with Maven 3.9 + Temurin JDK 21

**Alternatives Considered**:
- **Amazon Corretto**: Rejected - larger images, less widely used in community
- **Oracle GraalVM**: Rejected - not needed for standard JVM deployments
- **Standard (debian-based)**: Considered but alpine preferred for size

**Implementation Notes**:
- Update `FROM maven:3.9-eclipse-temurin-17-alpine` → `maven:3.9-eclipse-temurin-21-alpine`
- Update `FROM eclipse-temurin:17-alpine` → `eclipse-temurin:21-alpine`
- No other Dockerfile changes needed

---

### 4. Testing Strategy

**Question**: What testing is required to validate the Java 21 upgrade?

**Decision**: Run existing test suites without modification to verify backward compatibility.

**Rationale**:
- Java 21 is backward compatible - if code compiles, it should work
- Existing tests cover SDK functionality comprehensively (100+ unit tests)
- Example services have integration scenarios that exercise metadata generation
- No new tests needed for version upgrade alone

**Test Execution Plan**:
1. SDK: `mvn clean test` in `components/sdk/java/`
2. Sample service: Build and run metadata generation
3. Example services: Build, start, and generate metadata for each
4. Docker builds: Verify images build and containers start

**Success Criteria**:
- All unit tests pass (100+ tests)
- All services compile successfully
- Metadata generation completes for all services
- Docker containers start and respond to health checks

---

### 5. Performance Impact

**Question**: Will Java 21 affect build or runtime performance?

**Decision**: Expect comparable or better performance (within 5% variance acceptable).

**Rationale**:
- Java 21 includes multiple performance improvements over Java 17:
  - Generational ZGC (JEP 439) - better garbage collection
  - Improved JIT compilation
  - Virtual threads reduce memory overhead for concurrent operations
- Compilation speed similar (same compiler infrastructure)
- Startup time may improve slightly with optimized class loading

**Measurement Plan**:
- Record baseline: Maven build time on Java 17
- Measure: Maven build time on Java 21
- Compare: Should be within ±5% of baseline
- If regression: Investigate JVM flags or dependencies

**Implementation Notes**:
- No JVM tuning required for initial upgrade
- Future: Can optimize with `--enable-preview` for newer features

---

## Technology Stack Summary

| Component | Java 17 | Java 21 | Notes |
|-----------|---------|---------|-------|
| JDK | Eclipse Temurin 17 | Eclipse Temurin 21 | LTS → LTS upgrade |
| Maven | 3.8+ | 3.8+ (tested 3.9) | No change required |
| Spring Boot | 3.2.5, 3.4.1 | 3.2.5, 3.4.1 | Already compatible |
| Jackson | 2.17.2 | 2.17.2 | No change required |
| JUnit | 5.10.2 | 5.10.2 | No change required |
| Docker Base | temurin:17-alpine | temurin:21-alpine | Image version only |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Compilation failure | Low | High | Test build locally before commit |
| Test failures | Low | Medium | Run full test suite, investigate failures |
| Docker build issues | Very Low | Low | Test Docker builds locally |
| Performance regression | Very Low | Low | Measure build times, compare baselines |
| Dependency incompatibility | Very Low | Medium | Maven will report version conflicts |

**Overall Risk**: LOW - This is a well-supported LTS-to-LTS upgrade with strong backward compatibility guarantees.

---

## References

- [Java 21 Release Notes](https://jdk.java.net/21/release-notes)
- [Oracle Java SE 21 Documentation](https://docs.oracle.com/en/java/javase/21/)
- [Spring Boot 3.x System Requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [Maven Compiler Plugin Java 21 Support](https://maven.apache.org/plugins/maven-compiler-plugin/)
- [Eclipse Temurin Docker Images](https://hub.docker.com/_/eclipse-temurin)

---

## Summary

All research questions resolved with clear decisions:

✅ **Compatibility**: Java 21 fully backward compatible with Java 17  
✅ **Tooling**: Maven 3.8+ and Spring Boot 3.x support Java 21  
✅ **Docker**: Eclipse Temurin 21 images available and stable  
✅ **Testing**: Existing test suites sufficient for validation  
✅ **Performance**: Expected comparable or better with 5% variance acceptable

**No blockers identified. Ready to proceed to Phase 1 (Design & Contracts).**
