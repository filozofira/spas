# Quickstart: Command Produced Events Mapping

This quickstart shows how to declare which events a command produces (on success) so choreography tooling and agents can build flows without guessing.

## Metadata outcome

A command may declare:

- `produces[]`: array of objects with `{ type, version, when: "success" }`

Each produced `(type, version)` must exist in `events[]`.

## .NET service example (conceptual)

Goal: declare that command `create-order` produces event `order-created@1.0.0` on success.

- Define the event type and annotate it with `[SpasEvent]`.
- On the command, declare produced events using event types (not strings).

Expected `spas.json` snippet:

```json
{
  "commands": [
    {
      "name": "create-order",
      "produces": [
        { "type": "order-created", "version": "1.0.0", "when": "success" }
      ]
    }
  ],
  "events": [
    { "type": "order-created", "version": "1.0.0", "schemaRef": "schemas/events/order-created.schema.json" }
  ]
}
```

## Java service example (conceptual)

Goal: declare that command `create-order` produces event `order-created@1.0.0` on success.

- Annotate the event class with `@SpasEvent(type=..., version=...)`.
- On the command handler method, declare produced events using event classes.

Expected `spas.json` snippet is the same as above.

## Validation behavior

Metadata generation/validation fails fast when:
- command `name` is not kebab-case
- a produced `(type, version)` does not exist in `events[]`
- a command declares duplicate produced `(type, version)` pairs
- a referenced event type/class lacks the required event annotation/attribute
