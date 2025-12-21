# spas-compose CLI

Domain choreography composition tool.

It creates a domain workspace, pulls service contracts from a Repository, and generates deployment artifacts from `choreography.yaml`.

## Install (from source)

```bash
cd components/cli/spas-compose
npm install
npm run build
npm link
```

Verify:

```bash
spas-compose --version
spas-compose --help
```

## Commands

### `spas-compose init <workspace-name>`

Creates a domain workspace containing:

- `choreography.yaml`
- `services/` (pulled service metadata)
- `transformations/` (JSONata files)
- `.spas/schemas/` (schemas used by tooling/agents)

It also writes agent prompt files under `.github/` at the git root (if detected), otherwise next to the output directory.

```bash
spas-compose init e-commerce
cd e-commerce
```

### `spas-compose services pull <name> <version>`

Downloads service metadata + schemas from the Repository and saves them under `services/<name>/`.

```bash
spas-compose services pull order-service 1.0.0
spas-compose services pull order-service 1.0.0 --repo http://localhost:3000
```

### `spas-compose choreography build --docker`

Generates `docker-compose.yaml` and sidecar config files from `choreography.yaml`.

```bash
spas-compose choreography build --docker

# Fast local iteration (uses local images spas-{name}:latest)
spas-compose choreography build --docker --dev
```

## Configuration

- `SPAS_REPOSITORY_URL` sets the default repository URL (default: `http://localhost:3000`).

## References

- [../../../principles/component/13-cli.md](../../../principles/component/13-cli.md)
- [../../../principles/component/14-domain-choreography.md](../../../principles/component/14-domain-choreography.md)

