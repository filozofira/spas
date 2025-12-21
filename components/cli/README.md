# SPAS CLI

This folder contains the command-line tooling for working with SPAS services and domain choreographies.

## Tools

- [spas-service/README.md](./spas-service/README.md): Publish/pull service metadata archives (`/_spas/metadata`) to/from a Repository.
- [spas-compose/README.md](./spas-compose/README.md): Initialize a domain workspace, pull service contracts, and build deployable artifacts from [choreography.yaml](./spas-compose/schemas/choreography-v1.schema.json).

## Typical workflow

1. Build a service with an SDK and expose `/_spas/metadata` (Development mode)
2. Publish it with `spas-service`
3. Compose a domain with `spas-compose` (pull services → author choreography → build sidecar configs + docker compose)

## References

- [CLI principles](../../principles/component/13-cli.md)
- [Domain choreography](../../principles/component/14-domain-choreography.md)
