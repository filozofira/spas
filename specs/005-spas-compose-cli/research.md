# spas-compose CLI Research

## Design Rationale (Dec 2025)

This document captures the original vision and design decisions for the spas-compose CLI tool.

### Original Vision

The following vision was proposed by the product owner and guided the specification:

---

1. Compose is a complex operation which ideally would involve AI Agent in the loop in similar way the GitHub SpecKit does with prompts.
2. If we want involve AI in the loop than spas-compose would become simpler as follows:
3. Command `spas-compose init some-domain-name` would 1) create some-domain-name folder and 2) Predefined agent prompts inside .github (similar to speckit).
4. Inside some-domain-name folder there will be created
   1. README.md, containing standard instructions how to compose, i.e, commands to browse or pull services, about agent prompts, etc.
   2. An empty choreography file (unless we find some reasonable defaults later)
5. Once workspace is set developer can proceed as follows
   1. Run command `spas-compose services pull` for each service developer wants to pull (i.e. this would store service metadata and message schemas within the domain workspace). 
      1. In future we could even add a prompt which can allow developer to use AI agent to search repository and propose services to download, or similar.
   2. Once developer has downloaded all services, rest could be done using AI agent with developer in the loop since all machine-readable data will be available within the workspace.
      1. E.g. Developer can run agent prompt `/spas.compose Analyse contracts and metadata for the services I have pulled already and update choreography file accordingly.` (user could also propose some service names in the prompt that should participate to instruct the agent.)
      2. Once `/spas.compose` command is triggered, the AI agent analyses the service metadata and contracts and proposes the choreography by updating the choreography file (without transformation details, which will come later), prompting developer to check and write confirm if ok, or else provide feedback to fix. This part will loop as long as developer don't write confirm, hence it is iterative to ensure correct choreography.
      3. Once developer has responded with confirm, AI agent generates transformation files as well and asks developer again to confirm. Same here, iterative until developer confirms.
      4. Then developer can start over, adding new choreography by running again `/spas.compose` command and follow the same flow.
      5. Once all choreographies are written to choreography file and all transformation files are created, developer is back to using spas-compose cli to deploy the composition.
         1. I.e. `spas-compose choreography deploy (or generate) --docker` which generates docker-compose.yaml ready to run

---

### Key Decisions

The following ADRs were created to formalize design decisions:

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-036 | JSONata for transformation files | Language-agnostic (Node.js + Go); human-readable; AI-generatable |
| ADR-037 | AI-in-the-loop composition | Choreography involves semantic understanding unsuited for deterministic CLI |
| ADR-038 | Sidecar language flexibility | PoC uses Node.js; Go migration possible without changing transformation files |

### Design Discussion Summary

During specification refinement, the following decisions were made:

1. **Choreography file format**: YAML (`choreography.yaml`) — readable, consistent with docker-compose.yaml

2. **Transformation files**: 
   - Format: `.jsonata` (not `.js`) for sidecar language flexibility
   - Location: Per-service folders `choreography/transformations/<service-name>/*.jsonata`
   - Runtime: Volume-mounted to sidecars in Docker

3. **Multiple choreographies**: Single `choreography.yaml` with named flows (not separate files per flow)

4. **Validation**: Implicit in `deploy` command with `--dry-run` flag for preview

5. **Agent prompt location**: `.github/agents/spas-compose.md` at project root (VS Code/Copilot discovery)

6. **Simplified CLI surface**: 
   - `spas-compose init <domain-name>`
   - `spas-compose services pull <name> <version>`
   - `spas-compose choreography deploy --docker [--dry-run]`

### Future Considerations

- AI-assisted service discovery: `/spas.compose` prompt could search Repository and propose services
- Choreography diff: Compare versions of choreography.yaml
- Event replay: `spas-compose replay <events-file>` for local testing
- Kubernetes deployment: `spas-compose choreography deploy --k8s`

## References

- [spec.md](./spec.md) — Feature specification
- [principles/component/13-cli.md](../../principles/component/13-cli.md) — CLI source of truth
- [principles/component/14-domain-choreography.md](../../principles/component/14-domain-choreography.md) — Choreography specification
- [principles/appendix/28-decision-log.md](../../principles/appendix/28-decision-log.md) — ADRs 036-038
