# Feature Specification: Java 21 Upgrade

**Feature Branch**: `031-java-21-upgrade`  
**Created**: 2026-01-02  
**Status**: ✅ Completed (PoC)
**Completed**: 2026-01-03
**Input**: User description: "Update Java SDK and all Example services to Java version 21"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - SDK Development with Java 21 (Priority: P1)

As a developer working on the SPAS Java SDK, I need the SDK to target Java 21 so that I can use modern Java features and benefit from improved performance and security updates.

**Why this priority**: The SDK is the foundation for all Java-based services. Upgrading it first enables all dependent services to benefit from Java 21 features.

**Independent Test**: Can be fully tested by building the Java SDK with `mvn clean install` and verifying compilation succeeds with Java 21 as the target version.

**Acceptance Scenarios**:

1. **Given** the Java SDK parent POM, **When** I build the project with Maven, **Then** it compiles successfully targeting Java 21
2. **Given** all SDK modules (core, metadata, events, spring, etc.), **When** I run tests with `mvn test`, **Then** all tests pass on Java 21
3. **Given** the SDK is built with Java 21, **When** I install it to local Maven repository, **Then** dependent services can use it as a dependency

---

### User Story 2 - Example Service Compatibility (Priority: P2)

As a developer working on example services, I need all Java example services upgraded to Java 21 so that they demonstrate best practices using modern Java.

**Why this priority**: Example services showcase how to use the SDK and must stay current with recommended Java versions.

**Independent Test**: Can be tested by building each example service individually with `mvn clean package` and verifying successful compilation and metadata generation.

**Acceptance Scenarios**:

1. **Given** basket-service, rental-service, and fulfillment-service, **When** I build each with Maven, **Then** they compile successfully targeting Java 21
2. **Given** any Java example service, **When** I run metadata generation with `mvn spring-boot:run -Dspring-boot.run.arguments="--generate-metadata"`, **Then** metadata archives are generated successfully
3. **Given** updated example services, **When** I run the services, **Then** they start up and respond to requests correctly

---

### User Story 3 - Container Image Updates (Priority: P3)

As a DevOps engineer, I need Docker images for Java services to use Java 21 base images so that deployed containers benefit from the latest JVM improvements.

**Why this priority**: Container deployments should use updated Java runtimes for optimal performance and security.

**Independent Test**: Can be tested by building Docker images with `docker build` and running containers to verify they start successfully.

**Acceptance Scenarios**:

1. **Given** Dockerfiles for Java services, **When** I build images, **Then** they use eclipse-temurin:21 base image
2. **Given** a container built with Java 21 image, **When** I run the container, **Then** the service starts successfully and responds to health checks

---

### Edge Cases

- What happens if a developer has only Java 17 installed when trying to build Java 21 code? (Maven should fail with clear error message about Java version mismatch)
- How does the upgrade affect existing compiled artifacts? (Artifacts compiled with Java 17 can still be used as dependencies, but new builds require Java 21)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Java SDK parent POM MUST specify `java.version=21` for all SDK modules
- **FR-002**: All SDK modules (core, metadata, metadata-processor, events, spring, observability) MUST compile successfully with Java 21 as target
- **FR-003**: Example service `basket-service` MUST specify `java.version=21` in its pom.xml
- **FR-004**: Example service `rental-service` MUST specify `java.version=21` in its pom.xml
- **FR-005**: Example service `fulfillment-service` MUST specify `java.version=21` in its pom.xml
- **FR-006**: Sample service in SDK examples MUST specify `java.version=21` in its pom.xml
- **FR-007**: All Java service Dockerfiles MUST use `eclipse-temurin:21` as base image (or maven:3.9-eclipse-temurin-21 for build stages)
- **FR-008**: All existing unit tests MUST pass without modification when run on Java 21
- **FR-009**: Maven enforcer plugin rules MUST require Java 21 minimum (if enforcer is configured)
- **FR-010**: All services MUST generate metadata archives successfully after upgrade
- **FR-011**: All documentation files (README, CONTRIBUTING, installation guides) MUST be updated to reference Java 21 as the minimum supported version, excluding historical feature spec documents (specs/001-xxx through specs/030-xxx)
- **FR-012**: CLI command templates (e.g., `/spas.service init` agent prompts) MUST be updated to generate Java 21 references instead of Java 17

### Key Entities *(not applicable - infrastructure upgrade)*

No data entities involved in this upgrade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All SDK modules compile successfully with zero errors when Java 21 is specified as the target version
- **SC-002**: All unit tests (100+ tests across SDK modules) pass without modification on Java 21
- **SC-003**: All three Java example services (basket, rental, fulfillment) build and start successfully with Java 21
- **SC-004**: Metadata generation completes successfully for all example services after upgrade
- **SC-005**: Docker images build successfully using Java 21 base images and containers start without errors
- **SC-006**: Build time remains comparable or improves (within 5% of Java 17 build time)

### Assumptions

- Developers performing builds have Java 21 JDK installed (minimum Java 21.0.0)
- No SDK code currently uses Java 17-specific APIs in ways incompatible with Java 21
- Maven version 3.8 or higher is used (supports Java 21)
- Existing code does not rely on removed or deprecated features between Java 17 and 21
- CI/CD pipelines will be updated separately to use Java 21 (out of scope for this specification)
