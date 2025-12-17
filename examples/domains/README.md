# Domains

A workspace to experiment with composing domains and testing choreography compositions.

## Bootstrap and validate check list

A checklist to bootstrap and complete the choreography test.

1. Rebuild SDK, CLI tools, Sidecar (optional and only those components that has changed.)
2. Build sidecar docker image `docker build -t spas-sidecar:latest .`
3. Reset local SPAS repo database
4. Build all 3 examples\services and push to local SPAS repo (optional and only those services that has changed)
5. Delete `examples\domains\ecommerce\public` folder to start over
6. Use spas-compose init with --output argument
7. Use spas-compose services to pull services
8. Use AI prompt /spas.compose with some prompt to get AI to propose and compose the domain with pulled services
9. Use spas-compose build with --dry-run
10. Use spas-compose build without --dry-run to generate docker-compose
11. Hope to see it work :-)
