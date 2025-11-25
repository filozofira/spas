# Identity & Access

## Service Identity

- SPIFFE/SPIRE certificates or equivalent
- Short-lived tokens with automatic rotation

## Authentication

- North–South: OIDC/JWT at API Gateway
- East–West: mTLS in sidecar/mesh

## Authorization

- ABAC at sidecar (production)
- Policy evaluation based on claims and capabilities

## Identity Propagation

- Correlation and identity metadata carried in events
