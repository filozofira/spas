# Quickstart — Metadata Descriptions (017)

## Goal

Add optional plain-text descriptions to SPAS service metadata so choreography agents can use them as the primary semantic signal when matching endpoints/events to user intent.

## What changes

- Schemas accept optional `description` at:
  - Service root
  - Each endpoint
  - Each event
- SDKs expose description authoring:
  - Java: `@SpasService`, `@SpasCommand`, `@SpasQuery`, `@SpasEvent`
  - .NET: `[SpasService]`, `[SpasCommand]`, `[SpasQuery]`, `[SpasEvent]`
- Repository returns descriptions in runtime metadata.
- Agent prompt instructs using descriptions for semantic matching.

## Try it locally (typical flow)

1) Add descriptions in your service code

- Java (example intent):
  - Service: `description = "Manages order fulfillment"`
  - Endpoint: `description = "Creates a shipment and reserves inventory"`
  - Event: `description = "Emitted when shipment status changes"`

- .NET (example intent):
  - Service: `Description = "Order management"`
  - Command/query: `Description = "Creates a new order"`
  - Event: `Description = "Emitted after order creation succeeds"`

2) Build / generate metadata

- Java: run Maven build that generates `spas.json`.
- .NET: run the build / metadata generation pipeline for the service.

3) Publish and pull metadata

- Publish service metadata to the repository (existing SPAS flow).
- Pull into a domain workspace:
  - `spas-compose services pull`

4) Verify descriptions are present

- Confirm the pulled `spas.json` includes `description` at the levels you added.

5) Verify agent behavior

- Run the choreography agent prompt and confirm:
  - It reads and quotes description snippets when reasoning.
  - It uses descriptions to disambiguate similar endpoint/event names.
  - It does not invent descriptions when missing.

## Authoring rules

- Descriptions are plain text (no Markdown semantics).
- Descriptions may include newlines.
- SDKs should omit empty descriptions; schemas remain permissive and do not enforce length.
