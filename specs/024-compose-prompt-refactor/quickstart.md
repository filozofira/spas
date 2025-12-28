# Quickstart: Editing Agent Prompts

This guide explains how to modify the `spas-compose` AI agent prompt after the refactor.

## Location

Templates are located in `components/cli/spas-compose/templates/`.

- **Main Entry**: `agent-prompt.eta`
- **Sections**: `partials/*.eta`

## Editing

1.  Open the relevant `.eta` file.
2.  Make changes using Markdown syntax.
3.  Use `<%= it.domainRoot %>` to reference the domain root path.
4.  Use `<%~ include('partials/filename', it) %>` to include other partials.

## Testing

1.  Rebuild the CLI:
    ```bash
    cd components/cli/spas-compose
    npm run build
    ```
2.  Run `init` to generate a new prompt:
    ```bash
    node dist/index.js init my-domain --output ./test-output
    ```
3.  Inspect the generated file:
    ```bash
    cat ./test-output/my-domain/.github/agents/spas.compose.agent.md
    ```
