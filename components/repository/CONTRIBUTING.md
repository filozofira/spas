# Contributing to SPAS Repository Service

Guide for developers working on the Repository service itself (not for users consuming it via CLI—see [README.md](./README.md)).

## Prerequisites

- Node.js 20+
- npm
- Git
- Docker (optional, recommended for running the service in a local stack)

## Getting Started

```bash
cd components/repository
npm install
npm run build
```

## Run (development)

```bash
npm run dev
```

Default health endpoint: <http://localhost:3000/health>

## Tests and checks

```bash
npm test
npm run lint
npm run test:coverage
```

## Working with fixtures

Some tests rely on fixtures under `test/fixtures/`.

```bash
npm run fixtures
```

## Notes

- Schema validation uses `design-time-metadata-v1` by default (see `SPAS_SCHEMA_PATH` in [README.md](./README.md)).
- For expected behavior and constraints, consult [principles/component/11-repository.md](../../principles/component/11-repository.md).
