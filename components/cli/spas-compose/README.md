# spas-compose CLI

**Status**: Planned for Phase 3 continuation  
**Purpose**: Service composition and domain choreography tooling with AI-in-the-loop assistance

## Commands

| Command | Description |
|---------|-------------|
| `spas-compose init <domain-name>` | Create domain folder with scaffolded structure |
| `spas-compose services pull <name> <version>` | Download service metadata and schemas |
| `spas-compose choreography deploy --docker` | Generate docker-compose.yaml with sidecars |

**Key Flags**: `--repo`, `--dry-run`

## AI-in-the-Loop Composition

After pulling services, developers use the `/spas.compose` agent prompt for:

1. **Contract Analysis**: AI analyzes service metadata and event schemas
2. **Choreography Proposal**: AI proposes topic mappings and flow definitions
3. **Transformation Generation**: AI generates `.jsonata` transformation files
4. **Iterative Refinement**: Developer confirms or provides feedback; AI iterates

See `.github/agents/spas-compose.md` for the agent prompt.

## Domain Folder Structure

After `spas-compose init my-domain`:

```
my-domain/
├── README.md                      # Workflow instructions
├── choreography.yaml              # Named flows (AI-generated, developer-refined)
├── services/                      # Pulled service metadata
│   ├── order-service/
│   │   ├── spas.json
│   │   └── schemas/
│   └── fulfillment-service/
└── choreography/
    └── transformations/           # JSONata files per service
        ├── order-service/
        │   └── order-to-fulfillment.jsonata
        └── fulfillment-service/
            └── fulfillment-to-notification.jsonata
```

## JSONata Transformations

Transformation files use [JSONata](https://jsonata.org/) — a declarative JSON query and transformation language:

```jsonata
{
  "orderId": payload.id,
  "items": payload.lineItems.{ "sku": sku, "qty": quantity },
  "priority": payload.total > 1000 ? "high" : "normal"
}
```

**Why JSONata?**
- Language-agnostic: Works in Node.js and Go sidecars
- Human-readable: Suitable for AI generation and developer review
- Declarative: No side effects, testable, version-controllable

## Related Documentation

- [SPAS CLI Specification](../../../principles/component/13-cli.md)
- [Domain Choreography](../../../principles/component/14-domain-choreography.md)
- [ADR-036: JSONata transformations](../../../principles/appendix/28-decision-log.md)
- [ADR-037: AI-in-the-loop composition](../../../principles/appendix/28-decision-log.md)
