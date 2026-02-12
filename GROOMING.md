# Feature grooming

List of features to discuss before deciding to implement, here referred to as "Features".
All Features should be listed here to ensure AI agents have easy access to it.

- Features are enumerated for reference only and not priority-wise
- Features should not drive implementation decisions of other PoC/Production ready features unless strongly justified.
- G-Feature description as least can contain following parts:
  1. Must-have a brief description outlining what feature is about.
  1. Nice-to-have examples and perhaps even code snippets etc.
  1. Must-have justification or why implement the feature.

## F01: Add State element to Service Metadata

Add StateStore or State element to spas.json, design-time and runtime.

**StateStore design-time example:**

```json
{
  "schemaVersion": "design-time-metadata-v1",
  "id": "test-service",
  "name": "Test Service",
  //...
  "network": {
    "requiredEgress": [],
    "requiredStateStore": {
      "imageDigest": "sha256:abc123...",
      "imageRepository": "postgres",
      "imageTag": "15.15-trixie"
    }
  },
  "security": {
    //...
  },
  "license": "MIT"
}
```

**Justification:** Adding StateStore to spas.json can enable following improvements:

- Allow spas-compose CLI to add these dependencies to docker-compose file and hence allow one command to bootstrap full domain with all dependencies.
- Visualises full network dependencies required by service to operate.

### F02: Cross Domain Choreography

Extend framework to support choreographies across multiple domain contexts.

**Justification:** Adding this feature would allow domain composers to integrate multiple domains into one SPAS solution, allowing data to flow/synchronise across these boundaries. E.g. admin-e-commerce and public-e-commerce domain contexts can synchronise products, stock related data and similar.

### F03: SPIFFE/SPIRE Integration for Production Identity

Replace static JWT-based identity propagation with SPIFFE/SPIRE for production workload identity.

**Current state (PoC):** Identity propagation uses JWTs with manually managed signing keys, suitable for development but not production.

**Proposed state (Production):**

- Integrate SPIRE agent with sidecar for automatic SVID (SPIFFE Verifiable Identity Document) issuance
- Enable mTLS between sidecars using X.509 SVIDs
- Support SPIFFE identity format: `spiffe://<trust-domain>/ns/<namespace>/sa/<service>`

**Example SPIFFE identity:**

```text
spiffe://acme-corp.example/ns/production/sa/order-service
```

#### Justification

Production deployments require zero-trust security foundations.

**The Problem with Plain JWTs:**

- JWT signing keys must be distributed and rotated manually
- Compromised tokens valid until expiration
- JWTs identify users, not services themselves
- Each service needs credentials configured
- How does a new service prove it's legitimate?

**SPIFFE/SPIRE provides:**

- Automatic workload identity without static secrets
- Short-lived, auto-rotating certificates (minimal compromise window)
- Platform attestation (K8s, AWS, Azure) for trust bootstrap
- Native mTLS support for sidecar-to-sidecar communication
- Industry-standard identity format recognized by service meshes (Istio, Linkerd)

**Benefits over JWT:**

| Aspect                  | JWT (PoC)               | SPIFFE (Production)    |
| ----------------------- | ----------------------- | ---------------------- |
| Credential lifetime     | Hours to days           | Minutes (auto-rotated) |
| Secret management       | Manual key distribution | Automatic attestation  |
| Service-to-service auth | Custom implementation   | Native mTLS            |
| Compromise recovery     | Revoke + rotate keys    | Wait for next rotation |
| Trust bootstrap         | Pre-shared secrets      | Platform attestation   |

#### Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        SPIRE Server                              │
│              (issues identities, manages trust)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │  Agent   │    │  Agent   │    │  Agent   │
        │ (node)   │    │ (node)   │    │ (node)   │
        └────┬─────┘    └────┬─────┘    └────┬─────┘
             │               │               │
        ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
        │ Sidecar  │    │ Sidecar  │    │ Sidecar  │
        │ + SVID   │◄──►│ + SVID   │◄──►│ + SVID   │
        │ (mTLS)   │    │ (mTLS)   │    │ (mTLS)   │
        └────┬─────┘    └────┬─────┘    └────┬─────┘
             │               │               │
        ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
        │ Order    │    │Inventory │    │Fulfillment│
        │ Service  │    │ Service  │    │ Service  │
        └──────────┘    └──────────┘    └──────────┘
```

**SVID** = SPIFFE Verifiable Identity Document (X.509 cert or JWT)

---

**SPIFFE Identity Format:**

```
spiffe://acme-corp.example/ns/production/sa/order-service
```

| Part                | Meaning              |
| ------------------- | -------------------- |
| `spiffe://`         | SPIFFE URI scheme    |
| `acme-corp.example` | Trust domain         |
| `/ns/production`    | Kubernetes namespace |
| `/sa/order-service` | Service account      |

---
