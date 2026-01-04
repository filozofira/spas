# Feature Specification: Java 25 LTS Upgrade

**Feature Branch**: `035-java-25-lts-upgrade`  
**Created**: January 4, 2026  
**Status**: Draft  
**Input**: User description: "Upgrade Java SDK and all java example services using the SDK to Java version 25 LTS"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - SDK Builds and Tests with Java 25 (Priority: P1)

Developers building the SPAS Java SDK can successfully compile, package, and run all tests using Java 25 LTS, ensuring the SDK itself is compatible with the latest Java runtime features and security updates.

**Why this priority**: Without the SDK working on Java 25, nothing else can proceed. This is the foundation for all other services.

**Independent Test**: Can be fully tested by building the SDK with Java 25 and running the complete test suite. Delivers a working SDK compatible with Java 25.

**Acceptance Scenarios**:

1. **Given** the Java SDK project with Java 25 configured, **When** a developer runs the build process, **Then** all modules compile successfully without errors
2. **Given** the compiled SDK modules, **When** a developer executes the test suite, **Then** all unit and integration tests pass
3. **Given** the SDK built with Java 25, **When** a developer packages the artifacts, **Then** Maven successfully creates all distribution packages

---

### User Story 2 - Example Services Build with Java 25 (Priority: P2)

Service developers using the SPAS SDK can build and package all example services (basket-service, fulfillment-service, rental-service) with Java 25, demonstrating that SDK-consuming applications work correctly.

**Why this priority**: Validates that the SDK upgrade doesn't break downstream consumers and provides working examples for developers.

**Independent Test**: Can be tested by building each example service individually with Java 25 and verifying successful compilation and packaging.

**Acceptance Scenarios**:

1. **Given** an example service project configured with Java 25, **When** a developer builds the service, **Then** the build completes successfully
2. **Given** example services built with Java 25, **When** a developer runs the services, **Then** they start without runtime errors
3. **Given** running services, **When** a developer invokes service endpoints, **Then** services respond correctly with expected behavior

---

### User Story 3 - Tests Pass Across SDK and Services (Priority: P3)

Quality assurance teams and developers can verify that all automated tests pass for both the SDK and example services when running on Java 25, ensuring no regressions were introduced.

**Why this priority**: Comprehensive test validation ensures quality and catches edge cases that might not be obvious in basic functionality tests.

**Independent Test**: Can be tested by running the complete test suites across all modules and services, with measurable test coverage metrics.

**Acceptance Scenarios**:

1. **Given** all SDK modules with Java 25, **When** running unit tests, **Then** 100% of existing unit tests pass
2. **Given** all example services with Java 25, **When** running integration tests, **Then** all service-level tests pass
3. **Given** SDK and services running on Java 25, **When** executing annotation processor tests, **Then** metadata generation works correctly

---

### User Story 4 - Container Images Use Java 25 (Priority: P4)

DevOps teams and developers can build and deploy containerized services using Java 25 runtime images, ensuring services run correctly in Docker environments with the upgraded Java version.

**Why this priority**: Completes the deployment pipeline and ensures services can be containerized with Java 25, though local development (P1-P2) takes precedence.

**Independent Test**: Can be tested by building Docker images for services and verifying containers start successfully with Java 25 runtime.

**Acceptance Scenarios**:

1. **Given** a service Dockerfile configured with Java 25 base images, **When** a developer builds the Docker image, **Then** the build completes successfully
2. **Given** a Docker image built with Java 25, **When** a developer runs the container, **Then** the service starts without runtime errors
3. **Given** a running containerized service, **When** a developer invokes service endpoints, **Then** the service responds correctly

---

### User Story 5 - CLI Generates Java 25 Services (Priority: P4)

Developers using the `spas-service init` CLI command receive generated service projects configured for Java 25, ensuring new services start with the current Java LTS version and don't use outdated templates.

**Why this priority**: Ensures new projects created after the upgrade use Java 25 by default, preventing confusion and outdated code generation.

**Independent Test**: Can be tested by running `spas-service init` and verifying the generated project specifies Java 25 in all configuration files and documentation.

**Acceptance Scenarios**:

1. **Given** a developer runs `spas-service init new-service`, **When** the CLI generates the project, **Then** the pom.xml contains `<java.version>25</java.version>`
2. **Given** a generated service project, **When** a developer reads the README, **Then** the prerequisites specify Java 25+ (not Java 21+)
3. **Given** a generated service project with agent prompt templates, **When** the agent scaffolds code, **Then** the instructions reference Java 25 requirements

---

### User Story 6 - Documentation Reflects Java 25 (Priority: P4)

Developers reading SDK and service documentation see accurate Java 25 requirements, ensuring proper onboarding and avoiding confusion about required Java versions.

**Why this priority**: Accurate documentation is essential for developer experience but can be updated after functional code changes are complete.

**Independent Test**: Can be tested by searching documentation for Java version references and verifying all current docs (excluding historical specs) mention Java 25+.

**Acceptance Scenarios**:

1. **Given** the SDK README file, **When** a developer views the prerequisites, **Then** Java 25+ is listed as the required version
2. **Given** service README files, **When** a developer checks requirements, **Then** all services list Java 25+ as a prerequisite
3. **Given** all current documentation, **When** searching for "Java 21", **Then** no references are found except in historical specification documents (specs/001-034)

---

### Edge Cases

- What happens when existing code uses Java 21-specific APIs that are deprecated or removed in Java 25? (Production code should be refactored to use Java 25 compatible alternatives)
- How does the system handle compatibility with third-party dependencies that may not yet support Java 25? (Use latest versions and document any warnings)
- How are IDE configurations and developer workstation environments updated to support Java 25? (Documentation should guide developers through Java 25 JDK installation)
- When tests fail after upgrade, how is root cause determined? (Prioritize fixing production code for Java 25 compatibility over updating tests)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All Java SDK modules MUST compile successfully using Java 25 LTS runtime and compiler
- **FR-002**: All Java SDK modules MUST execute their complete test suites successfully on Java 25 LTS
- **FR-003**: All example services using the SDK (basket-service, fulfillment-service, rental-service) MUST build successfully with Java 25 LTS
- **FR-004**: All example services MUST run and respond to requests correctly when deployed with Java 25 LTS runtime
- **FR-005**: SDK annotation processors MUST generate metadata correctly when run with Java 25 LTS compiler
- **FR-006**: All Maven build configurations MUST specify Java 25 as the source and target version
- **FR-007**: All Spring Boot integration features MUST work correctly with Java 25 LTS runtime
- **FR-008**: SDK MUST maintain backward compatibility with services expecting standard Java features (no breaking API changes)
- **FR-009**: All dependency versions MUST be compatible with Java 25 LTS, using the latest available versions from each library
- **FR-010**: SDK examples within the SDK package MUST build and run successfully with Java 25
- **FR-011**: Build documentation MUST clearly document any known compatibility warnings or issues with third-party dependencies on Java 25
- **FR-012**: All Java version configurations MUST specify Java 25 exclusively, with no backward compatibility to Java 21
- **FR-013**: Dependencies MAY be upgraded to next major versions if required for Java 25 compatibility, with changes documented
- **FR-014**: All Dockerfiles MUST be updated to use Java 25 base images
- **FR-015**: Production code MUST be adapted to ensure Java 25 compatibility when test failures occur, with test updates only when testing implementation details that legitimately changed
- **FR-016**: CLI tool templates (spas-service init) MUST generate Java 25 projects and documentation

### Key Entities

This feature primarily involves configuration changes rather than data entities. The key artifacts affected are:

- **SDK Build Configurations**: Maven POM files specifying Java version requirements, compiler settings, and plugin versions across all SDK modules (parent + 6 modules)
- **Example Service Configurations**: Maven POM files for demonstration services that consume the SDK (7 services: basket, fulfillment, rental, inventory, order, product, subscription)
- **Container Images**: Dockerfiles for all services specifying Java runtime versions (14+ Dockerfiles)
- **CLI Templates**: spas-service init templates that generate new SPAS services with Java version specifications (8 template files)
- **Documentation**: README files and badges showing Java version requirements (SDK, services, root-level docs)
- **Test Suites**: Automated test collections that validate SDK functionality and service behavior

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All SDK module builds complete successfully in under 5 minutes on standard development machines with Java 25
- **SC-002**: 100% of existing SDK test suites pass without modification when run on Java 25 LTS
- **SC-003**: All example services (basket-service, fulfillment-service, rental-service) build and start within 30 seconds on Java 25
- **SC-004**: Developer setup time for Java 25 environment is under 15 minutes following updated documentation
- **SC-005**: Zero runtime errors occur when services built with Java 25 handle standard request/response flows
- **SC-006**: SDK artifact sizes remain within 10% of previous Java 21 builds, indicating no significant bloat
- **SC-007**: Service startup time remains within 10% of Java 21 baseline performance

## Assumptions

- Java 25 LTS has been officially released and is stable for production use
- Latest versions of third-party dependencies (Jackson, Spring Boot, JUnit, Mockito) are used even if they show minor compatibility warnings, with issues documented
- Development teams have access to Java 25 JDK installations
- Continuous integration systems can be updated to use Java 25 runtime
- Container base images with Java 25 are available (for Docker deployments)
- No deprecated Java features used in current codebase are removed in Java 25
- Maven build tooling is compatible with Java 25 (Maven 3.6+ assumed)

## Dependencies

- Java 25 LTS JDK availability and documentation
- Updated versions of key dependencies:
  - Spring Boot framework (Java 25 compatible version)
  - Jackson JSON library (Java 25 compatible version)
  - Testing frameworks (JUnit 5, Mockito)
- Maven build tooling version 3.6 or higher
- CI/CD pipeline infrastructure updates for Java 25 runtime
- Container base images with Java 25 (if services are containerized)

## Out of Scope

- Performance optimization specific to Java 25 features (focus is compatibility, not optimization)
- Adoption of new Java 25 language features or APIs (this is a version upgrade only)
- Refactoring existing code to leverage Java 25 improvements
- Updating documentation beyond version number changes and dependency upgrade notes
- Migration of .NET SDK or other non-Java components
- Changes to service functionality or business logic
- Training materials or workshops about Java 25 features
- Maintaining backward compatibility with Java 21 (clean cut-over to Java 25 only)
- Comprehensive testing of new features introduced by dependency major version upgrades (focus is on Java 25 compatibility, not new dependency features)

## Clarifications

### Session 2026-01-04

- Q: When third-party dependencies (Spring Boot, Jackson, etc.) don't yet have Java 25-compatible versions, what should be the approach? → A: Use latest available versions and document any known compatibility issues or warnings
- Q: Should the upgrade maintain compatibility with Java 21, allowing developers to build with either version, or require Java 25 exclusively? → A: Require Java 25 exclusively - drop Java 21 support completely
- Q: If a specific dependency version doesn't exist for Java 25, should you upgrade to the next major version of that dependency, or stay on the current version and accept potential warnings? → A: Upgrade to next version
- Q: Should container images (Dockerfiles) for services be updated as part of this upgrade, or is that deferred to a separate task? → A: Update Dockerfiles as part of this upgrade to use Java 25 base images
- Q: When a test fails after the Java 25 upgrade, should the focus be on fixing the code to work with Java 25, or investigating whether the test itself needs updating? → A: Prioritize fixing the production code to work with Java 25
