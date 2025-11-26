# Tasks

1. Analyse and define the SPAS Protocol
1. Decide if Capabilities should be predefined or free text style.
1. Decide DataClassification values (public | internal | confidential | pii) and how to enforce it.
1. Decide Enclosure values (strict | moderate | open) and how to enforce it.
1. Decide if SPAS Repository metadata should also include dependencies and how to use it.
1. SPAS SDK/Domain Templates are nice to have

## Comments on Specification

1. 03-service-model.md
    1. Public Contract -> All services should expose gRPC contracts for both north-south and east-west communication since sidecar/mesh will be calling these endpoints in both cases (i.e. service invocation)
    1. State model summary -> should be entirely up to a service, i.e. we don't see any use cases where SPAS framework should mandate anything special.
    1. Adaptation Layer -> SPAS service only exposes the gRPC endpoints, which can be invoked by sidecar/mesh as configured in choreography.
    1. Health & Observability -> SPAS framework does not specify any details about the internals of Health endpoints, but it does recommend their existence, special in Kubernetes setting where this is required.
    1. Security -> Since SPAS service an also be invoked by the API Gateway, it should support authentication protocol to get the identity from JWT or similar, which is later used in identity propagation upon publishing the outbound events.
    1. Compliance Summary -> What does "Provide schemas for mapping" mean?
1. 04-service-contract.md
    1. gRPC API/Streaming: Allowed with backpressure guidance -> Is this related to east-west traffic and how to describe it best.
    -> Need more info?
    1. Event Contracts
        1. Published events -> What is versioned types?
        1. Subscribed events -> We see the sidecar invoking the appropriate SPAS service endpoint upon occurrence of an  event SPAS service is subscribed to. As agreed, in PoC idempotency handling will be solely responsibility of the SPAS service, while in future we may consider ensuring idempotency at the sidecar level. Does this section need adjustment?
        1. Envelope headers -> can we use strictly Cloud Events schema terminology in POC and can we apply same for north-south communication?
    1. Consistency & Idempotency
        1. Service declares idempotency strategy -> Does this mean that SPAS service has a full responsibility in PoC, i.e. no particular specification how this is implemented but simply a recommendation due to at least once delivery semantics?
        1. SDK MAY add helpers in future -> Can we add that this in could be extended in form of handling idempotency at the sidecar/mesh layer?
    1. Health & Readiness
        1. Since SPAS framework is responsible for sidecar/mesh, can we state that SPAS service its self would have to expose health  & readiness endpoints and document sidecar/mesh endpoints only in 11-sidecar-contract.md or similar?
1. 05-service-lifecycle.md
    1. Packaging -> What does "Embed version and commit metadata labels" mean?
    1. Deployment -> Should we also add that the transformation mapping configurations should be deployed according to chosen sidecar/mesh implementation (i.e. depending on our choice of DAPR, Istio, etc.)
    1. Operation -> Let's keep "Define SLOs and alerts" outside PoC for now
1. 06-service-metadata.md
    1. Required Fields -> We will have to revisit this once more. See `./appendix/26-reference-examples.md/SPAS Service metadata (Simplified for PoC)` for inspiration. I.e. SPAS service metadata declares inbound gRPC endpoints which can be invoked according to `choreography.yaml` as well as outbound/events which can be used to configured outbound traffic from the SPAS service. Se also for inspiration:
        1. Reference to internal SPAS service schemas which is configured with the declared inbound or outbound endpoint (i.e. spec/inbound/path: "/complete-payment"/schema).
        1. OCI image and tag is referenced inside deployment
        1. security element contains network element which besides enclosure also contains allowedEgress.
1. 08-grpc-protocol.md
    1. Service documents idempotency strategy in `spas.json` -> Do we need this, and if so, how?
1. 09-event-protocol.md
    1. Envelope -> Should we right away use Cloud Events?
    1. Payload Schema -> Consider using Json only
1. 10-adaptation-protocol.md
    1. Mapping Rules -> Added Transformation rules should be specified in separate files and referenced by from `choreography.yaml`
    1. Validation -> In general what is the difference between this validation and one described in 13-repository-spec.md, are these redundant or they each cover different aspects of validation?
1. 11-sidecar-contract.md
    1. Responsibilities -> Missing transformation mapping
    1. Configuration: Should mapping specs be described here as well as how spec is accessed by a sidecar
1. 12-package-format.md
    1. Package Structure -> SPAS service design-time structure should be as little opinionated as possible, i.e. developers building a SPAS service should decide how to structure their project, while Domain context design-time would require some SPAS specific structure to ensure easy work with choreography. Runtime package structure would basically depend on chosen choreography application (i.e. will it be enforced by sidecars and DAPR etc.)
1. 13-repository-spec.md
    1. I suggest to remove domainContext unless you provide good argument to keep it.
1. 14-schema-registry.md
    1. API (baseline) -> should we consider merging with services endpoints, i.e.  `GET /services/{id}/versions/{version}/schemas` — download schema, or similar?
1. 15-runtime-environment.md
    1. Sidecar Injection/Sidecar handles mTLS, routing...etc. -> should we include that sidecars also execute transformations?
    1. Platforms -> Let's remove bare metal for beginning unless you think this is important to keep in mind during development to enable it in future?
1. 16-sdk-specification.md
    1. Required Capabilities/Sidecar client integration -> I don't see this as part of SDK if we are using existing frameworks for sidecars/mesh (i.e. DAPR, Istio etc.), i.e. this should not be a SPAS SDK consideration, but framework. Do you agree?
1. 17-cli-specification.md
    1. Commands -> There are many commands here which might not be needed hence we have to define those later as we learn more about the implementation details. Can you help phrase that?
1. 18-testing-harness.md
    1. Contract Testing -> I need more details on this points (i.e. how you think testing Consumer-driven contracts (Pact-style) or Validate against schema registry)
1. 19-security-model.md
    1. Principles -> what do you mean by `runtime` in Defense in depth (edge, sidecar/mesh, runtime)?
    1. Threat Model (High Level) -> can you elaborate on this, specially on Supply chain tampering
1. 20-identity-access.md
    1. Service Identity/SPIFFE/SPIRE certificates or equivalent -> Can you elaborate on this?
    1. Service Identity/Short-lived tokens with automatic rotation -> Can you elaborate on this, i.e. why and where should this handled and how?
    1. Authentication/North–South: OIDC/JWT at API Gateway -> In this context I see first part happening at API Gateway level, which is external component, where SPAS services which are invoked by API Gateway should enable this protocol when directly invoked by the API Gateway. How best to describe these two aspects of authentication?
1. 21-network-security.md
    1. Egress -> I see two distinguished areas here, 1) declaring required egress on SPAS service level presumably in spas.json, and 2) configuring and enforcing the network security as part of choreography. Do you agree and how best to depict that?
    1. Enclosure levels/PoC: Declarative only (metadata/choreography.yaml) -> as mentioned above, I see Declarative only done in (spas.json). Do you agree?
    1. Encryption/TLS 1.3 at the edge; mTLS for east–west -> since Edge is external I guess TLS 1.3 should be formulated as recommendation while all sidecar<->SPAS service communication should use mTLS. Do you agree and if so, can we formulate that better?
1. 22-data-security.md
    1. Encryption/at rest -> this I guess should be a recommendation for SPAS service developers, which should be implemented at developers will. Do you agree?
    1. Minimization & Sovereignty/Declare data domains in `spas.json` -> what do you mean by this?
1. 23-versioning-strategy.md
    1. API Versioning/REST (edge): versioned paths (`/v1/...`) -> I guess this should be expressed as recommendation, since this is an external component. Do you agree?
1. 24-compliance-checklist.md
    1. A SPAS-compliant service satisfies:
        1. Single bounded context -> is this needed and is there any way to validate?
        1. Declared idempotency strategy -> is this needed and is there any way to validate?
        1. Declared consistency model (commands ACID; queries MAY be eventual) -> is this needed and is there any way to validate?
1. 27-glossary.md
    1. Sidecar: Helper container handling cross-cutting concerns -> seems not to mention anything about transformation. Should it?
    1. Adaptation: Configuration-driven event transformation -> this is quite related to Domain Composition defined by `choreography.yaml`. Should these be merged somehow?
