# Data Model: Command Produced Events Mapping

## Overview

This feature adds an explicit relationship from Commands to Events in design-time metadata.

## Entities

### Command

Represents a canonical write operation.

Fields:
- `name` (string, required): canonical command identifier, kebab-case
- `version` (string, optional/required per schema decision): command contract version
- `produces` (array, optional): list of ProducedEventRef

Validation:
- `name` matches `^[a-z0-9]+(-[a-z0-9]+)*$`

### ProducedEventRef

Represents a produced event reference from a producer (command).

Fields:
- `type` (string, required): MUST reference an entry in `events[].type`
- `version` (string, required): MUST match the referenced event’s `version`
- `when` (string, required): PoC value MUST be `"success"`

Validation:
- Within a command, `(type, version)` pairs must be unique

### Event

Existing outbound event contract.

Fields:
- `type` (string, required)
- `version` (string, required)
- `schemaRef` (string, required)
- `description` (string, optional)

## Relationships

- `Command 1 -> 0..N ProducedEventRef`
- `ProducedEventRef (type, version) -> exactly 1 Event (type, version)`

## Notes

- PoC does not model failure events.
- The model is designed to extend to future producers like `jobs[]` by reusing `produces[]`.
