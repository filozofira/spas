# Evolution Policy

## Backward Compatibility

- Events: additive-only changes
- APIs: versioned endpoints (parallel support during migration)
- Metadata: new fields optional; unknown fields ignored by consumers

### Metadata Descriptions

- `description` fields are optional and may be absent.
- Tools and agents MUST tolerate missing/empty descriptions and fall back to other contract signals.
- Descriptions are advisory and MUST NOT be treated as authoritative contract semantics.

## Forward Compatibility

- Consumers must ignore unknown fields
- Feature flags where appropriate

## Breaking Change Process

1. Deprecation announcement
2. Parallel support (old + new)
3. Migration guide
4. Sunset date
5. Removal

## Governance Process

- SPAS Improvement Proposals (SIPs)
- Maintainer review and approval
- Changelog publication

## Related Documents

- [Versioning Strategy](23-versioning-strategy.md)
- [Decision Log](../appendix/27-decision-log.md)
- [Principles](../README.md)
