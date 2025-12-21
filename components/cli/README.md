# SPAS CLI

Command-line tooling for working with SPAS services and domain choreographies.

## For CLI Users (Service Developers & Domain Architects)

- [spas-service](./spas-service/README.md) - Publish/pull service metadata archives to/from Repository
- [spas-compose](./spas-compose/README.md) - Initialize domain workspaces, pull services, build deployment artifacts

## For CLI Contributors (Tooling Developers)

Contributing to the CLI implementations:

- [spas-service Contributing Guide](./spas-service/CONTRIBUTING.md)
- [spas-compose Contributing Guide](./spas-compose/CONTRIBUTING.md)

## Typical workflow

1. Build a service with an SDK and expose `/_spas/metadata` (Development mode)
2. Publish it with `spas-service`
3. Compose a domain with `spas-compose` (pull services → author choreography → build sidecar configs + docker compose)

## References

- [CLI principles](../../principles/component/13-cli.md)
- [Domain choreography](../../principles/component/14-domain-choreography.md)
