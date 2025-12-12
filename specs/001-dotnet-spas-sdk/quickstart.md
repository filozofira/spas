# Quickstart: .NET SPAS SDK (Phase 1)

- Place source under `components/sdk/.Net`
- Create solution `Spas.Sdk.sln`; add projects:
  - Spas.Sdk.Core
  - Spas.Sdk.Metadata
  - Spas.Sdk.Events
  - Spas.Sdk.Inbound
  - Spas.Sdk.Configuration
  - Spas.Sdk.Observability
  - Spas.Sdk.Testing
- Implement SDK composition to generate `spas.json`
- Add dev endpoint `/_spas/metadata` (dev-only) returning archive with `spas.json` + schemas
- Use CloudEvents helpers to publish with trace/correlation
- Enable tracelog middleware for request timing and correlation IDs
