# SPAS Repository Service

Stores and validates SPAS service metadata archives (a ZIP containing `spas.json` + `schemas/`).

Primary consumers:

- `spas-service` publishes archives to the repository
- `spas-compose` downloads (pulls) them into a domain workspace

## Run locally

### Docker (recommended)

```bash
cd components/repository
docker compose up --build
```

Health endpoint: <http://localhost:3000/health>

### Node.js (development)

```bash
cd components/repository
npm install
npm run build
npm run dev
```

## Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error` |
| `STORAGE_PROVIDER` | `sqlite` | `postgres` is not implemented yet |
| `SQLITE_PATH` | `./data/repository.db` | Used when `STORAGE_PROVIDER=sqlite` |
| `SPAS_SCHEMA_PATH` | `./schemas/design-time-metadata-v1.schema.json` | Schema used to validate uploaded `spas.json` |

## API (high level)

- Publish: `POST /services/{serviceId}:{version}` (multipart form field `archive=@file.zip`)
- Search/list: `GET /services` (optional `?capability=...` or `?boundedContext=...`)
- Inspect: `GET /services/{serviceName}` and `GET /services/{serviceName}/versions`
- Retrieve: `GET /services/{serviceName}/versions/{version}`
- Download: `GET /services/{serviceName}/versions/{version}/download`
- Unpublish: `DELETE /services/{serviceName}/versions/{version}`

## Schemas

- Uploads are validated against `design-time-metadata-v1`.
- Retrieval may return `runtime-metadata-v1` after repository enrichment/transformation.

See:

- [../sdk/schemas/design-time-metadata-v1.schema.json](../sdk/schemas/design-time-metadata-v1.schema.json)
- [schemas/runtime-metadata-v1.schema.json](./schemas/runtime-metadata-v1.schema.json)

## References

- [../../principles/component/11-repository.md](../../principles/component/11-repository.md)
- [../cli/spas-service/README.md](../cli/spas-service/README.md)

