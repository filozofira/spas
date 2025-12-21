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

## Verification (manual)

Use these quick checks to validate the feature end-to-end.

1) Confirm SDKs emit descriptions only when provided

- In a Java or .NET service, set a non-empty service/endpoint/event description and regenerate `spas.json`.
- Remove/blank out the descriptions and regenerate again.
- Expected:
  - When provided: `description` keys appear at the relevant levels.
  - When blank/omitted: `description` keys are omitted (not present as empty strings).

2) Confirm repository preserves and returns descriptions

- Publish metadata to the repository using the existing flow.
- Pull metadata into a domain workspace with `spas-compose services pull`.
- Open the pulled `services/<service>/spas.json` and confirm the `description` fields match what you authored.

3) Confirm agent uses descriptions safely

- Run the compose agent against a domain workspace.
- Expected:
  - It quotes the exact `description` snippets it used to justify endpoint/event selection.
  - If a candidate lacks `description`, it explicitly notes that and falls back to names/types/schemas.
  - It never invents missing descriptions.

## Authoring rules

- Descriptions are plain text (no Markdown semantics).
- Descriptions may include newlines.
- SDKs should omit empty descriptions; schemas remain permissive and do not enforce length.
