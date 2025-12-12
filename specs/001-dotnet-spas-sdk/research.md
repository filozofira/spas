# Research: .NET SPAS SDK (Phase 0)

## Decisions

- Decision: SDK packaging structure → Multi-package (segregated capabilities)
- Rationale: Aligns with modular responsibilities (metadata, events, inbound, config, observability, testing), allows independent versioning and lighter installs.
- Alternatives considered: Single monolithic library; interfaces-only core with external plugins.

- Decision: Source location → components/sdk/.Net
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

- Scaffold projects under components/sdk/.Net with solution file.
- Implement `Spas.Sdk.Metadata` builders and SDK composition of spas.json.
- Implement dev `/_spas/metadata` endpoint (dev-only) returning archive.
- Implement CloudEvents helpers and publish helper in `Spas.Sdk.Events`.
- Implement inbound scaffolding in `Spas.Sdk.Inbound`.
- Implement config helpers in `Spas.Sdk.Configuration`.
- Implement tracelog middleware in `Spas.Sdk.Observability`.
- Provide testing utilities in `Spas.Sdk.Testing`.
