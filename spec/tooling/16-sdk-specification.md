# SDK Specification

Defines a language-agnostic contract for SDKs.

## Target Languages

- .NET, Java, Node.js (TypeScript), Python, Go

## Required Capabilities

- Code generation for gRPC
- Metadata generation/validation for `spas.json`
- Event publish/subscribe helpers with correlation metadata
- Sidecar client integration (discovery/config)
- Testing utilities: schema-driven fixtures, pact-style contracts

## Design Constraints

- No mandatory external infrastructure
- Pluggable transport/storage abstractions

## Developer Experience

- Project templates and scaffolding
- Clear error messages and diagnostics
