# Repository Specification

Defines the SPAS repository API and storage model.

## Responsibilities

- Store `spas.json` and schema artifacts
- Index services by `id`, `version`, `capabilities`, `domainContext`, `boundedContext`
- Link to OCI images in external registries

## API Endpoints (baseline)

- `POST /services` — publish metadata
- `GET /services/{id}` — service details
- `GET /services/{id}/versions` — list versions
- `GET /services/{id}/versions/{version}` — version details
- `GET /services?capability={cap}` — search by capability
- `GET /services?domainContext={domainContext}` — search by domain context
- `DELETE /services/{id}/versions/{version}` — unpublish

## Validation

- Schema validation of `spas.json`
- Duplicate detection (id + version)
- Image digest existence check (optional in PoC)

## Auth & Policy

> PoC: No auth; local repo for speed
>
> Production: OIDC/RBAC; signed packages required; policy enforcement

## Storage Model

- Metadata store (RDBMS/NoSQL)
- Schema registry integrated in PoC
- OCI images in external registry (Docker Hub/ACR/ECR)
