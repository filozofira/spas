# Data Security & Privacy

## Classification

- Levels: public | internal | confidential | pii
- PoC: Metadata declaration only
- Production: Enforce via sidecar/policy where applicable

## Encryption

- At rest for confidential and pii
- In transit via TLS/mTLS

## Minimization & Sovereignty

- Declare data domains in `spas.json`
- Store only domain-essential data

## Audit

- Log access and changes; retain per org policy

## Related Documents

- [Security Model](19-security-model.md)
- [Service Metadata](../service-specification/06-service-metadata.md)
- [Compliance Checklist](../governance/24-compliance-checklist.md)
