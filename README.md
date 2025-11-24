# ✅ **SPAS Framework Specification

    ```
    /spec
    01-overview.md
    02-core-concepts.md
    03-spas-service-spec.md
    04-choreography-protocols.md
    05-spas-metadata-spec.md
    06-packaging-and-distribution.md
    07-repository-api-spec.md
    08-sdk-contract.md
    09-cli-spec.md
    10-runtime-and-execution.md
    11-security-spec.md
    12-versioning-and-evolution.md
    13-governance-and-compliance.md
    ```

Each document is short, focused, and independent—easy to maintain and evolve.

Below is the meaning and recommended content of each section.

---

# 01. **Overview**

*Purpose: introduce the framework and scope.*

**Contents:**

* What SPAS is
* Design goals (self-contained, portable, adaptable, cloud/OS agnostic)
* High-level architecture diagram
* Components:

  * SPAS Services
  * Repository
  * SDK
  * CLI
  * Execution environment
  * Choreography layer / sidecar

This document rarely changes.

---

# 02. **Core Concepts**

*Purpose: foundational terminology and system model.*

**Contents:**

* Bounded context definition
* North–South vs East–West communication
* Domain vs canonical schemas
* Adaptation layer (mapping, transformation)
* Service immutability and packaging principles
* Minimal runtime assumptions

This file anchors terminology for all other documents.

---

# 03. **SPAS Service Specification**

*Purpose: how to build a SPAS-compliant service.*

**Contents:**

* Directory structure
* Required interfaces (gRPC)
* Required event interfaces
* Service lifecycle expectations
* Sidecar integration points
* Health + readiness
* Observability contracts

This document is mostly consumed by service developers.

---

# 04. **Choreography Protocols**

*Purpose: define communication rules.*

### **Synchronous Protocol (North–South)**

* gRPC integration rules
* Naming conventions
* Versioning rules
* Error semantics & idempotency

### **Asynchronous Protocol (East–West)**

* Canonical event schema rules
* Envelope (headers, trace-id, correlation-id)
* Event filtering
* Ordering & timing semantics
* Domain event vs technical event guidance

This file evolves as choreography grows.

---

# 05. **SPAS Metadata Specification (`spas.json`)**

*Purpose: standardize metadata across services.*

**Contents:**

* JSON schema
* Required fields (id, version, capabilities)
* Event declarations
* API definitions
* Adaptation profiles
* Extensions (future-proofing)
* Validation rules

This is the anchor for tooling and repository interactions.

---

# 06. **Packaging & Distribution**

*Purpose: how a SPAS service is packaged for portability.*

**Contents:**

* Package structure
* Docker image reference model
* Metadata artifact layout
* Signing rules (optional for POC)
* Integrity checks
* Compatibility rules

Includes how to produce and consume a package.

---

# 07. **Repository API Specification**

*Purpose: define how metadata + images are stored and retrieved.*

### **Repository Responsibilities**

* Metadata storage
* Linking to external container registries
* Indexing by:

  * service-id
  * capabilities
  * version

### **API Endpoints**

* `push-metadata`
* `pull-metadata`
* query/search
* (POC) No-auth rules
* Validation behaviour

### **Storage Model**

* separation of:

  * metadata store
  * container image store (external)

This file is crucial for future ecosystem growth.

---

# 08. **SDK Contract**

*Purpose: define what any language SDK must implement.*

**Contents:**

* Must expose code generation tools
* Must include sidecar client library
* Must provide event publishing/subscription helpers
* Must validate SPAS metadata
* Must enforce compatibility

Defines only the contract, not implementations.

---

# 09. **CLI Specification**

*Purpose: standardize developer workflow.*

**Commands:**

* `spas init`
* `spas build`
* `spas package`
* `spas push`
* `spas pull`
* `spas run`
* `spas domain configure` (optional, depends on multi-domain support)

Document command behaviour, inputs, outputs, error semantics.

---

# 10. **Runtime & Execution Environment**

*Purpose: describe how SPAS services run portably.*

**Contents:**

* Minimum runtime requirements
* Sidecar injection model
* Container runtime assumptions
* Kubernetes / local / hybrid execution
* Security boundaries
* Observability integration

This file ensures portability.

---

# 11. **Security Specification**

*Purpose: unify all security requirements.*

### **Package Security**

* Signing
* Integrity validation

### **Communication Security**

* North–South:

  * OIDC or JWT validation
* East–West:

  * identity propagation model
  * metadata propagation rules

### **Secret handling**

* Runtime secrets
* Isolation between services

---

# 12. **Versioning & Evolution**

*Purpose: maintain long-term compatibility.*

### **API versioning**

* gRPC package version rules
* Additive-only changes allowed

### **Event versioning**

* backward compatible schemas
* new fields must be optional

### **Metadata versioning**

* semantic versioning rules

### **Deprecation policies**

This is critical for ecosystem stability.

---

# 13. **Governance & Compliance**

*Purpose: define how services become “SPAS-compliant”.*

**Contents:**

* SPAS Compliance Checklist
* Validation tooling
* Repository enforcement behaviour
* Contribution model for SDKs

This closes the loop between developers, tooling, and the ecosystem.

## Archive

I am starting to build a framework that promotes building Self-contained, Portable and Adaptable Services (SPAS), which can be reusable across different domain contexts.
As such, SPAS is a synthesis of DDD, microservices, and EDA, by promoting building the service around a single bounded context, that has no direct dependencies outside its own bounded context, is portable to any OS or Cloud Platform, and that can adapt to any domain specific choreographies, hence making the service shareable and reusable across different Domain contexts.

E.g. build an order service, which easily can fit in into Telecom as in the Retail domain context or similar.
