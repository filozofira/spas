# Feature Specification: Sidecar Config Generator

**Feature Branch**: `006-sidecar-config-generator`  
**Created**: 2025-12-14  
**Completed**: 2025-12-14  
**Status**: ✅ Complete (PoC)
**Input**: User description: "Add SidecarConfigGenerator to spas-compose CLI to generate sidecar configuration files from choreography.yaml alongside docker-compose.yaml"

## Context

The `spas-compose choreography deploy --docker` command generates `docker-compose.yaml` that references sidecar configuration files:

```yaml
volumes:
  - ./config.order-service.json:/app/config.json
```

However, **these config files are not generated**. When running `docker compose up`, it fails because `config.{service}.json` files don't exist.

This feature adds `SidecarConfigGenerator` to produce these config files automatically during the deploy command, enabling a single-command workflow that produces all artifacts needed to run the composed domain.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Generate Sidecar Configs During Deploy (Priority: P1)

As a developer, I want `spas-compose choreography deploy --docker` to generate sidecar configuration files alongside docker-compose.yaml so that I can run the composed domain with a single command without manual configuration.

**Why this priority**: This is the core functionality that bridges choreography definition to runnable sidecar containers. Without it, the entire choreography deploy workflow is incomplete.

**Independent Test**: Can be fully tested by running `spas-compose choreography deploy --docker` with a valid choreography.yaml and verifying `config.{service}.json` files are generated for each participating service.

**Acceptance Scenarios**:

1. **Given** a domain with valid `choreography.yaml` containing flows with order-service and fulfillment-service, **When** I run `spas-compose choreography deploy --docker`, **Then**:

   - `docker-compose.yaml` is generated (existing behavior)
   - `config.order-service.json` is generated with correct inbound/outbound entries
   - `config.fulfillment-service.json` is generated with correct inbound/outbound entries
   - Both config files are in the workspace root alongside docker-compose.yaml

2. **Given** a flow where order-service publishes `order-created` event to `orders-requested` topic with transformation, **When** config is generated, **Then** `config.order-service.json` contains:

   ```json
   {
     "outbound": [
       {
         "topic": "orders-requested",
         "transform": "transformations/order-service/outbound-order-created.jsonata"
       }
     ]
   }
   ```

3. **Given** a flow where fulfillment-service subscribes to `orders-requested` topic with transformation and endpoint `/incoming`, **When** config is generated, **Then** `config.fulfillment-service.json` contains:

   ```json
   {
     "inbound": [
       {
         "kind": "event",
         "topic": "orders-requested",
         "transform": "transformations/fulfillment-service/inbound-order-created.jsonata",
         "invokeEndpoint": "/incoming"
       }
     ]
   }
   ```

4. **Given** a service participates in multiple flows (publishing and subscribing), **When** config is generated, **Then** config file contains all inbound and outbound entries from all flows aggregated.

---

### User Story 2 - Validate Config Generation in Dry Run (Priority: P1)

As a developer, I want `--dry-run` to also validate sidecar config generation so that I can verify the complete output before writing files.

**Why this priority**: Dry run should give complete visibility into all generated artifacts, not just docker-compose.yaml.

**Independent Test**: Can be fully tested by running `spas-compose choreography deploy --docker --dry-run` and verifying output shows both docker-compose.yaml content AND sidecar config contents.

**Acceptance Scenarios**:

1. **Given** a valid choreography, **When** I run `spas-compose choreography deploy --docker --dry-run`, **Then** output shows:

   - docker-compose.yaml content (existing)
   - List of sidecar config files that would be generated
   - Summary of inbound/outbound entries per service

2. **Given** `--dry-run` flag, **When** command completes, **Then** no files are written (including config files).

---

### User Story 3 - Handle Missing Transformation References (Priority: P2)

As a developer, I want clear error messages when transformation files referenced in choreography don't exist so that I know exactly what's missing before deployment.

**Why this priority**: Good error handling prevents runtime failures and guides developers to resolution.

**Independent Test**: Can be tested by referencing a non-existent transformation file in choreography.yaml and verifying the error message includes the missing file path.

**Acceptance Scenarios**:

1. **Given** choreography references `transformations/order-service/outbound-order.jsonata` that doesn't exist, **When** I run `spas-compose choreography deploy --docker`, **Then** command fails with error listing the missing file path.

2. **Given** multiple transformation files are missing, **When** I run deploy, **Then** error lists ALL missing files (not just the first one).

3. **Given** transformation file exists but has invalid JSONata syntax, **When** I run deploy, **Then** command fails with syntax error including file path and line number (existing behavior, verify preserved).

---

### User Story 4 - Support Optional Transformations (Priority: P2)

As a developer, I want to define event routes without transformations for passthrough scenarios so that simple event forwarding doesn't require unnecessary JSONata files.

**Why this priority**: Not all event routes require transformation. Forcing empty transformation files adds unnecessary complexity.

**Independent Test**: Can be tested by defining an event route without `transform` field and verifying the generated config omits the transform property.

**Acceptance Scenarios**:

1. **Given** a target in choreography without `transform` field, **When** config is generated, **Then** the inbound entry omits the `transform` property (passthrough).

2. **Given** an outbound event route without transformation, **When** config is generated, **Then** the outbound entry omits the `transform` property.

---

### Edge Cases

- What happens when a service has no inbound or outbound entries? — Config file is still generated with empty arrays for consistency.
- What happens when same topic appears in multiple flows? — Entries are deduplicated by topic+service combination.
- What happens when choreography.yaml is empty (no flows)? — No config files are generated, warning is logged.
- What happens when transformation path format is incorrect? — Validation error with path format guidance.
- What happens when config file already exists? — Overwritten without prompt (same as docker-compose.yaml behavior).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `spas-compose choreography deploy --docker` MUST generate `config.{service}.json` for each service participating in any flow.
- **FR-002**: Generated config MUST use the sidecar config schema with `inbound` and `outbound` arrays.
- **FR-003**: Inbound entries MUST include `kind` ("event" or "command"), `topic`, optional `transform`, and `invokeEndpoint`.
- **FR-004**: Outbound entries MUST include `topic` and optional `transform`.
- **FR-005**: Transform paths MUST be relative to the sidecar's `/app/transformations` mount point.
- **FR-006**: Config generation MUST aggregate entries from all flows where a service participates.
- **FR-007**: Config files MUST be written to workspace root alongside docker-compose.yaml.
- **FR-008**: `--dry-run` MUST show sidecar config summaries without writing files.
- **FR-009**: Missing transformation files MUST be validated and reported before writing any output.
- **FR-010**: CLI MUST log config file generation to stdout (non-JSON mode) or include in result object (JSON mode).

### Key Entities

- **Sidecar Config**: JSON file defining inbound subscriptions/commands and outbound publications for a single service's sidecar instance.
- **Inbound Entry**: Configuration for receiving events or commands with topic/command name, optional transformation reference, and invokeEndpoint.
- **Outbound Entry**: Configuration for publishing events with topic name and optional transformation reference.

### Sidecar Config Schema

```json
{
  "inbound": [
    {
      "kind": "event",
      "topic": "orders-requested",
      "transform": "transformations/inbound-order.jsonata",
      "invokeEndpoint": "/incoming"
    },
    {
      "kind": "command",
      "command": "create-order",
      "transform": "transformations/create-order-input.jsonata",
      "invokeEndpoint": "/commands/create"
    }
  ],
  "outbound": [
    {
      "topic": "orders-processed",
      "transform": "transformations/outbound-order.jsonata"
    }
  ]
}
```

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `spas-compose choreography deploy --docker` produces all files needed to run `docker compose up` without manual file creation.
- **SC-002**: Config generation adds <1 second to deploy command execution time.
- **SC-003**: Generated configs are valid JSON parseable by sidecar without errors.
- **SC-004**: All transformation paths in generated configs resolve correctly when mounted in Docker.

### Definition of Done

- [ ] `SidecarConfigGenerator` class created in `components/cli/spas-compose/src/services/`
- [ ] Integration with `choreography-deploy.ts` to call generator after docker-compose generation
- [ ] Config files written to workspace root
- [ ] Dry-run shows config summaries
- [ ] Unit tests for config generation (target: 10+ tests)
- [ ] Integration test with sample choreography.yaml
- [ ] Existing 67 tests continue to pass

## Implementation Notes

### Input: choreography.yaml Structure

```yaml
version: "1.0"
domain: e-commerce
flows:
  order-to-fulfillment:
    description: Order placed triggers fulfillment
    participants:
      - order-service
      - fulfillment-service
    events:
      - source: order-service
        event: order-created
        topic: orders-requested
        targets:
          - service: fulfillment-service
            transform: transformations/fulfillment-service/inbound-order-created.jsonata
```

### Output: Generated Config Files

**config.order-service.json**:

```json
{
  "inbound": [],
  "outbound": [{ "topic": "orders-requested" }]
}
```

**config.fulfillment-service.json**:

```json
{
  "inbound": [
    {
      "kind": "event",
      "topic": "orders-requested",
      "transform": "transformations/inbound-order-created.jsonata",
      "invokeEndpoint": "/incoming"
    }
  ],
  "outbound": []
}
```

### Integration Point

In `choreography-deploy.ts`, after generating docker-compose.yaml:

```typescript
// Generate sidecar configs
const configGenerator = new SidecarConfigGenerator(workspaceRoot);
const configResult = configGenerator.generate(choreography);

if (!options.dryRun) {
  for (const [serviceName, config] of Object.entries(configResult.configs)) {
    fs.writeFileSync(
      path.join(workspaceRoot, `config.${serviceName}.json`),
      JSON.stringify(config, null, 2)
    );
  }
}
```

## Related Documents

- [005-spas-compose-cli spec](../005-spas-compose-cli/spec.md) — Original CLI spec
- [principles/component/10-sidecar-contract.md](../../principles/component/10-sidecar-contract.md) — Sidecar config schema reference
- [principles/component/14-domain-choreography.md](../../principles/component/14-domain-choreography.md) — Choreography structure
