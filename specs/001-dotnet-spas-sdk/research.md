# Research: .NET SPAS SDK (Phase 0)

> **Outdated (Historical)**: This research doc references a dev-only runtime metadata endpoint at `/_spas/metadata`.
> The current supported approach is **offline** metadata archive generation (SDK-triggered) and archive-based publishing; the runtime endpoint workflow has been removed.
> The original research notes are preserved for historical context.

## Decisions

- Decision: SDK packaging structure → Multi-package (segregated capabilities)
- Rationale: Aligns with modular responsibilities (metadata, events, inbound, config, observability, testing), allows independent versioning and lighter installs.
- Alternatives considered: Single monolithic library; interfaces-only core with external plugins.

- Decision: Source location → components/sdk/dotnet
- Rationale: Matches repository convention and user request; language-specific folder for .NET SDK.
- Alternatives considered: packages/dotnet, sdk/dotnet.

- Decision: Dev endpoint payload → Archive with spas.json + schemas
- Rationale: Faster local validation and tooling; avoids coupling to CLI/repo.
- Alternatives considered: JSON-only metadata; manifest + URLs.

- Decision: Identity vs Authorization → Identity helpers now; defer auth wiring
- Rationale: Usability without locking into providers; security by default enforced later.
- Alternatives considered: Full auth now; defer both.

- Decision: Observability → Minimal opt-in tracelog middleware now; advanced later
- Rationale: Immediate value without over-scoping; aligns with Constitution Observability First.
- Alternatives considered: Full suite now; hooks-only.

- Decision: SDK/Sidecar Event Boundary → SDK sends raw payload + headers; sidecar wraps CloudEvents
- Rationale: Clear separation of concerns per Constitution; SDK prepares context, sidecar handles envelope structure and transformations.
- Alternatives considered: SDK constructs full CloudEvents envelope (violates boundary); SDK sends opaque binary (loses observability).
- Implementation: HTTP headers propagate metadata (`traceparent`, `x-service-name`, `x-event-type`, `x-correlation-id`, `x-user-id`, `x-tenant-id`); sidecar constructs CloudEvents 1.0 envelope from headers.

- Decision: Inbound Header Propagation → Sidecar passes trace/correlation/identity via HTTP headers
- Rationale: Maintains trace continuity and context across sidecar → service boundary; enables distributed tracing.
- Implementation: Required `traceparent` header; optional `x-correlation-id`, `x-user-id`, `x-tenant-id` headers populate `SpasTrace` and `SpasContext`.

## Implications

- Modules:
  - Spas.Sdk.Metadata
  - Spas.Sdk.Events
  - Spas.Sdk.Inbound
  - Spas.Sdk.Configuration
  - Spas.Sdk.Observability
  - Spas.Sdk.Testing

- Versioning: Capabilities can evolve independently; shared `Spas.Sdk.Core` hosts common primitives (trace, correlation, identity accessors).

- Testing: Each module ships unit/integration samples; end-to-end sample under examples/.

## Tasks for Phase 1

- Scaffold projects under components/sdk/dotnet with solution file.
- Implement `Spas.Sdk.Metadata` builders and SDK composition of spas.json.
- Implement dev `/_spas/metadata` endpoint (dev-only) returning archive.
- Implement event publishing helper in `Spas.Sdk.Events` that sends raw payload + headers to sidecar (no CloudEvents envelope in SDK).
- Implement inbound scaffolding in `Spas.Sdk.Inbound` with header extraction for trace/correlation/identity.
- Implement config helpers in `Spas.Sdk.Configuration`.
- Implement tracelog middleware in `Spas.Sdk.Observability`.
- Provide testing utilities in `Spas.Sdk.Testing`.
