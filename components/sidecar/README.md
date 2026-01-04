# SPAS Sidecar

Runtime sidecar deployed alongside each service in a SPAS domain.

For protocol semantics (endpoints, headers, transforms), see the [Sidecar Contract](../../principles/component/10-sidecar-contract.md).

This component is infrastructure. In most workflows it is started and configured by generated deployment artifacts (for example via `spas-compose`).

## References

- [Sidecar Contract](../../principles/component/10-sidecar-contract.md)
- Sidecar config schema: [schemas/sidecar-config-v1.schema.json](./schemas/sidecar-config-v1.schema.json)

## For Contributors

See [CONTRIBUTING.md](./CONTRIBUTING.md).
