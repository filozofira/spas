# Data Security & Privacy

## Classification

- Levels: public | internal | confidential | pii
- PoC: Metadata declaration only
- Production: Enforce via sidecar/policy where applicable

## Encryption

- At rest: RECOMMENDED for `confidential` and `pii` classifications (implementation choice: database encryption, disk encryption)
- In transit: Enforced via TLS (edge) and mTLS (east–west)

## Minimization & Sovereignty

- Optional `dataCategories[]` (instead of ambiguous "data domains") may be declared for future policy scopes (e.g. `payment`, `personal`, `telemetry`)
- Store only domain-essential data; avoid retaining derived transient data beyond processing need

## Audit

- Log access and changes; retain per org policy

## Related Documents

- [Security Model](19-security-model.md)
- [Service Metadata](../service-specification/06-service-metadata.md)
- [Compliance Checklist](../governance/24-compliance-checklist.md)
