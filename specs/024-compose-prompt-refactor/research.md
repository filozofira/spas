# Phase 0: Research & Technical Approach

## Unknowns & Resolutions

### 1. Template Engine Selection
- **Decision**: Use `Eta` (v3.5.0+).
- **Rationale**: Matches `spas-service` implementation. Lightweight, fast, supports partials (`include`), and familiar syntax (`<%= %>`).
- **Alternatives**: Handlebars (heavier), EJS (older), Mustache (too logic-less).

### 2. Template Distribution
- **Decision**: Embed templates in the build artifact (`dist/templates`).
- **Mechanism**:
  - Source: `components/cli/spas-compose/templates/`
  - Build Script: `tsc && npm run copy:templates`
  - Copy Script: `fs.cpSync('templates', 'dist/templates', { recursive: true })`
- **Runtime Loading**:
  - Resolve path relative to `__dirname` (or `import.meta.url` equivalent in ESM).
  - `spas-service` uses a `getModuleDir()` utility; we will replicate this.

### 3. Prompt Structure
- **Decision**: Modularize into partials.
- **Structure**:
  ```
  templates/
  ├── agent-prompt.eta
  └── partials/
      ├── technical-reference.eta
      ├── workflow-phases.eta
      ├── known-pitfalls.eta
      ├── troubleshooting.eta
      ├── known-limitations.eta
      ├── constraints.eta
      ├── error-handling.eta
      └── example-prompts.eta
  ```

## Implementation Strategy

1.  **Dependencies**: Add `eta` to `package.json`.
2.  **Build Config**: Update `package.json` scripts to copy templates.
3.  **Code**:
    - Create `src/utils/paths.ts` (for `getModuleDir`).
    - Refactor `src/utils/templates.ts` to use `Eta`.
    - Create `.eta` files in `templates/`.
4.  **Verification**: Run `spas-compose init` and verify output matches requirements.
