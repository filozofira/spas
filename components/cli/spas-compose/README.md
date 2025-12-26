# spas-compose CLI

Domain choreography composition tool.

It creates a domain workspace, pulls service contracts from a Repository, and generates deployment artifacts from `choreography.yaml`.

## For Users

### Typical Workflow

1. Create a domain workspace:

```bash
spas-compose init <domain>
cd <domain>
```

2. Pull the services you want to compose:

```bash
spas-compose services pull <service-name> <version>
```

3. Author the choreography:

- Edit `choreography.yaml` and add JSONata files under `transformations/`, or
- Use the `/spas.compose` agent prompt (requires `DOMAIN:<name>`) to propose and generate mappings.

4. Build runnable artifacts and start the domain:

```bash
spas-compose choreography build --docker
docker compose up
```

### Commands

#### `spas-compose init <workspace-name>`

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

When invoking the agent, always include the domain selector:

```text
/spas.compose DOMAIN:e-commerce Analyze services and propose choreography
```

#### `spas-compose services pull <name> <version>`

Downloads service metadata + schemas from the Repository and saves them under `services/<name>/`.

```bash
spas-compose services pull order-service 1.0.0
spas-compose services pull order-service 1.0.0 --repo http://localhost:3000
```

#### `spas-compose choreography build --docker`

Generates `docker-compose.yaml` and sidecar config files from `choreography.yaml`.

```bash
spas-compose choreography build --docker

# Fast local iteration (uses local images spas-{name}:latest)
spas-compose choreography build --docker --dev
```

### Configuration

- `SPAS_REPOSITORY_URL` sets the default repository URL (default: `http://localhost:3000`).

### Additional Resources

- [CLI Principles](../../../principles/component/13-cli.md)
- [Domain Choreography](../../../principles/component/14-domain-choreography.md)

## For Contributors

See [CONTRIBUTING.md](./CONTRIBUTING.md).

