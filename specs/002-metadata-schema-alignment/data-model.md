# Data Model: Design-Time Metadata (design-time-metadata-v1)

## Entities

- ServiceMetadata
  - schemaVersion: string (const "design-time-metadata-v1")
  - id: string (kebab-case)
  - name: string
  - description: string (optional)
  - version: string (SemVer)
  - boundedContext: string
  - capabilities: string[]
  - endpoints: EndpointContract[]
  - events: EventContract[]
  - consistency: Consistency
  - network: Network
  - security: Security
  - license: string (SPDX)

- EndpointContract
  - name: string
  - type: Command | Query
  - protocol: Http | gRPC
  - methodPath: string (HTTP route or gRPC method path)
  - version: string
  - schemaRef: string (registry or local path)
  - description: string (optional)

- EventContract
  - type: string (CloudEvents type)
  - version: string
  - schemaRef: string (registry or local path)

- Consistency
  - commands: ACID
  - queries: STRONG | EVENTUAL

- Network
  - requiredEgress: string[] (host:port)

- Security
  - authentication?:
    - type: string (e.g., jwt)
    - requiredScopes: string[]
  - dataClassification: (public | internal | confidential | pii)[]

## Validation Rules

- id: ^[a-z0-9]+(-[a-z0-9]+)*$
- endpoints[].type: Command|Query only
- endpoints[].protocol: Http|gRPC only
- consistency.commands: ACID only
- security.dataClassification: non-empty
- network.requiredEgress: non-empty array

## Relationships

- ServiceMetadata has many EndpointContract
- ServiceMetadata has many EventContract
- EndpointContract references schema via schemaRef
- EventContract references schema via schemaRef
