# Data Model: .NET SDK and Principles Documentation Cleanup

**Date**: 2026-01-03  
**Feature**: [spec.md](./spec.md)  
**Purpose**: Define entities and relationships for cleanup operations

## Overview

This feature is primarily a documentation and file structure cleanup. The "data model" describes the entities being modified, not runtime data structures.

## Entities

### SDK Package

**Description**: A NuGet package in the SPAS .NET SDK

**Attributes**:
- Name (e.g., "Spas.Sdk.Core", "Spas.Sdk.Inbound")
- Status: `ACTIVE` | `EMPTY` | `DOCUMENTED_AS_DEFERRED`
- Directory Path (e.g., "components/sdk/dotnet/src/Spas.Sdk.Core/")
- Purpose (description of functionality)
- Has Implementation (boolean - does it contain code beyond .csproj?)

**Instances**:
- `Spas.Sdk.Core` - ACTIVE
- `Spas.Sdk.Metadata` - ACTIVE
- `Spas.Sdk.Events` - ACTIVE
- `Spas.Sdk.Observability` - ACTIVE
- `Spas.Sdk.Configuration` - ACTIVE
- `Spas.Sdk.Inbound` - ACTIVE but DOCUMENTED_AS_DEFERRED (needs correction)
- `Spas.Sdk.Testing` - EMPTY (to be removed)

**Operations**:
- Remove (delete directory tree)
- Update Documentation (correct README)
- Verify Build (dotnet build succeeds)

---

### Principles Document

**Description**: A markdown file in `principles/` defining architectural contracts

**Attributes**:
- File Path (relative to repo root)
- Category (service, protocol, component, infrastructure, security, governance, tooling, appendix)
- Number (for appendix files: 26, 27, 28)
- References (list of components/features mentioned)
- Status: `ALIGNED` | `NEEDS_UPDATE` | `OUTDATED`

**Key Instances**:
- `principles/component/12-sdk.md` - NEEDS_UPDATE (package counts)
- `principles/protocol/09-event-protocol.md` - verify ALIGNED
- `principles/appendix/26-reference-examples.md` - OUTDATED (to be removed)
- `principles/appendix/27-glossary.md` - ALIGNED (to be renumbered to 26)
- `principles/appendix/28-decision-log.md` - ALIGNED (to be renumbered to 27)

**Operations**:
- Audit (check alignment with implementations)
- Update Content (correct discrepancies)
- Remove (delete file)
- Rename (change file number)

---

### Cross-Reference

**Description**: A markdown link or text mention connecting documents

**Attributes**:
- Source Document (file containing reference)
- Target Document or Component (what's being referenced)
- Reference Type: `MARKDOWN_LINK` | `TEXT_MENTION`
- Status: `VALID` | `BROKEN` | `OUTDATED`

**Operations**:
- Scan (grep for patterns)
- Update (change link targets or numbering)
- Validate (check link resolution)

---

### SPAS Component

**Description**: A major system component with implementations to verify

**Attributes**:
- Name (e.g., ".NET SDK", "Java SDK", "Repository", "CLI", "Sidecar")
- Implementation Location (directory path)
- README Path
- Features (list of documented capabilities)

**Key Instances**:
- .NET SDK - `components/sdk/dotnet/`
- Java SDK - `components/sdk/java/`
- Repository - `components/repository/`
- CLI (spas-service, spas-compose) - `components/cli/`
- Sidecar - `components/sidecar/`

**Operations**:
- Verify Implementation (check feature exists in code)
- Check Documentation (README accurately describes features)

---

### Example Service

**Description**: A reference service demonstrating SDK usage

**Attributes**:
- Name (e.g., "order-service")
- Directory Path (e.g., "examples/services/order-service/")
- Dockerfile Path
- Dependencies (SDK packages referenced)

**Operations**:
- Scan Dependencies (check for removed package references)
- Validate Build (service builds successfully)
- Validate Run (service starts without errors)

---

## Relationships

```
SDK Package (1) --documented-in--> (1) SDK README
SDK Package (1) --referenced-by--> (0..*) Example Service
SDK Package (1) --referenced-by--> (0..*) Principles Document

Principles Document (1) --references--> (0..*) SPAS Component
Principles Document (1) --cross-references--> (0..*) Principles Document
Principles Document (1) --contains-examples-of--> (0..*) SDK Package

SPAS Component (1) --has--> (1) README
SPAS Component (1) --described-by--> (1..*) Principles Document

Appendix File (numbered) --renumbered-to--> (1) Appendix File (new number)
```

## State Transitions

### SDK Package Lifecycle (this cleanup)

```
EMPTY (Spas.Sdk.Testing)
  → [Remove Project] 
  → DELETED

DOCUMENTED_AS_DEFERRED (Spas.Sdk.Inbound)
  → [Update Documentation]
  → ACTIVE (with correct docs)
```

### Principles Document Lifecycle (this cleanup)

```
OUTDATED (26-reference-examples.md)
  → [Remove File]
  → DELETED

ALIGNED (27-glossary.md)
  → [Renumber]
  → ALIGNED (26-glossary.md)

NEEDS_UPDATE (component/12-sdk.md)
  → [Audit & Correct]
  → ALIGNED
```

### Cross-Reference Lifecycle (this cleanup)

```
OUTDATED (links to appendix/27)
  → [Update Link]
  → VALID (links to appendix/26)

BROKEN (mentions Spas.Sdk.Testing)
  → [Remove Mention or Update]
  → VALID
```

## Validation Rules

**SDK Package Validation**:
- If Status = EMPTY AND Has Implementation = false → REMOVE
- If Status = DOCUMENTED_AS_DEFERRED AND Has Implementation = true → UPDATE DOCUMENTATION
- After changes → dotnet build MUST succeed, dotnet test MUST pass

**Principles Document Validation**:
- Each documented SDK feature → verify exists in at least one SDK implementation
- Each documented protocol behavior → verify in Sidecar or SDK code
- Each documented CLI command → verify in CLI README or help text
- After changes → all markdown links MUST resolve (no 404s)

**Appendix Numbering Validation**:
- Appendix files MUST be sequential (26, 27, ...)
- All cross-references MUST use current numbering
- principles/README.md navigation MUST reflect correct numbers

**Example Service Validation**:
- No Dockerfile references to removed SDK packages
- Service builds successfully after SDK cleanup
- At least 3 services tested across different domains

## Notes

This is not a traditional data model with database schemas. It describes the file structure and documentation entities being manipulated during cleanup. No runtime data structures or persistence is involved.
