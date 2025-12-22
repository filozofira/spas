# Validation Rules: Command Produced Events Mapping

This document specifies additional validation rules that are not fully expressible in JSON Schema alone.

## 1) Produced event references must exist

For each command `c` and each produced entry `p` in `c.produces[]`:

- There MUST exist an event `e` in `events[]` where:
  - `e.type == p.type` AND
  - `e.version == p.version`

If not, validation MUST fail.

## 2) Uniqueness within a command

Within a single command, `(type, version)` pairs in `produces[]` MUST be unique.

If duplicates exist, validation MUST fail.

## 3) when value

For PoC, `when` MUST be exactly `"success"`.

(Enforced by schema; repeated here for clarity.)
