# Template Function Contracts

**Phase**: 1 - Design & Contracts  
**Date**: December 19, 2025

## Purpose

Define the signatures and contracts for template generation functions affected by this feature.

---

## New Function

### generateRuntimeMetadataSchema()

Generate the runtime metadata JSON Schema as a formatted string.

**Signature**:
```typescript
export function generateRuntimeMetadataSchema(): string
```

**Parameters**: None

**Returns**: 
- `string` - Complete JSON Schema (Draft 7) for runtime metadata, formatted with 2-space indentation

**Behavior**:
- Returns deterministic output (same content every invocation)
- Output is valid JSON Schema Draft 7 format
- Content matches `components/repository/schemas/runtime-metadata-v1.schema.json` exactly
- Formatted using `JSON.stringify(schema, null, 2)` for readability

**Example Usage**:
```typescript
const schema = generateRuntimeMetadataSchema();
writeFileSync('runtime-metadata-v1.schema.json', schema, 'utf-8');
```

**Contract Guarantees**:
- ✅ Output is parseable as JSON
- ✅ Output validates as JSON Schema Draft 7
- ✅ Output contains all required fields ($schema, $id, title, description, type, properties, required)
- ✅ No external dependencies or file I/O
- ✅ Pure function (no side effects)

---

## Modified Functions

### generateWorkspaceReadme(workspaceName: string)

**Current Signature**: 
```typescript
export function generateWorkspaceReadme(workspaceName: string): string
```

**Changes**: Update Structure section template to list all three schemas

**Current Output** (Structure section):
```markdown
└── .spas/
    └── schemas/
        └── sidecar-config-v1.schema.json
```

**Updated Output** (Structure section):
```markdown
└── .spas/
    └── schemas/
        ├── sidecar-config-v1.schema.json
        ├── choreography-v1.schema.json
        └── runtime-metadata-v1.schema.json
```

**Contract Guarantees**:
- ✅ Structure section lists all files actually scaffolded
- ✅ Schema files listed in alphabetical order (choreography, runtime-metadata, sidecar-config)
- ✅ Tree structure correctly shows parent `.spas/schemas/` directory

---

### generateAgentFile(domainRoot: string)

**Current Signature**:
```typescript
export function generateAgentFile(domainRoot: string): string
```

**Changes**: 
1. Update Phase 3: Propose section to specify "Choreography Diagram (mermaid flowchart)" instead of "Sequence Diagram"
2. Add instruction to add diagram to workspace README.md
3. Reference mermaid flowchart format with subgraph pattern
4. Update Actions section to document three build command variations with correct flags

**Current Output** (Phase 3, partial):
```markdown
**Phase 3: Propose**
1. Generate Sequence Diagram showing the event flow
```

**Updated Output** (Phase 3, partial):
```markdown
**Phase 3: Propose**
1. Generate Choreography Diagram (mermaid flowchart) showing the event flow
   - Use format: `flowchart LR` with `subgraph [Domain Name]`
   - Add the diagram to workspace README.md
   - Reference pattern from examples/domains/README.md
```

**Current Output** (Actions section, partial):
```markdown
- Dry-run validation: `spas-compose choreography build --dry-run`
```

**Updated Output** (Actions section, partial):
```markdown
- Dry-run validation: `spas-compose choreography build --docker --dry-run`
- Docker dev build: `spas-compose choreography build --docker --dev`
- Docker prod build: `spas-compose choreography build --docker`
```

**Contract Guarantees**:
- ✅ Phase 3 uses correct diagram terminology (Choreography, not Sequence)
- ✅ Diagram format specified (mermaid flowchart LR with subgraph)
- ✅ All build commands include `--docker` flag
- ✅ Three distinct build variations documented (dry-run, dev, prod)

---

## WorkspaceService.create() Integration

**Current Implementation** (lines 146-164):
```typescript
// Copy runtime metadata schema from repository component
const runtimeMetadataSchemaPath = join(
  process.cwd(),
  "components",
  "repository",
  "schemas",
  "runtime-metadata-v1.schema.json",
);
if (existsSync(runtimeMetadataSchemaPath)) {
  const runtimeMetadataSchema = readFileSync(
    runtimeMetadataSchemaPath,
    "utf-8",
  );
  writeFileSync(
    join(schemasDir, "runtime-metadata-v1.schema.json"),
    runtimeMetadataSchema,
    "utf-8",
  );
}
```

**Updated Implementation**:
```typescript
// Generate runtime metadata schema inline
const runtimeMetadataSchemaContent = generateRuntimeMetadataSchema();
writeFileSync(
  join(schemasDir, "runtime-metadata-v1.schema.json"),
  runtimeMetadataSchemaContent,
  "utf-8",
);
```

**Changes**:
- Remove file copy logic with `existsSync()` and `readFileSync()`
- Call `generateRuntimeMetadataSchema()` to get schema content
- Always write schema (no conditional based on source file existence)

**Contract Guarantees**:
- ✅ Schema always generated (no silent failure in external projects)
- ✅ Consistent with sidecar and choreography schema generation pattern
- ✅ No external file dependencies

---

## Testing Contracts

### Unit Tests (templates.test.ts)

**New Test**: `generateRuntimeMetadataSchema()`
```typescript
test('generateRuntimeMetadataSchema returns valid JSON Schema', () => {
  const schema = generateRuntimeMetadataSchema();
  const parsed = JSON.parse(schema); // Must not throw
  
  expect(parsed.$schema).toBe('http://json-schema.org/draft-07/schema#');
  expect(parsed.$id).toBe('https://spas.io/schemas/runtime-metadata-v1.schema.json');
  expect(parsed.title).toBe('SPAS Runtime Metadata');
  expect(parsed.type).toBe('object');
  expect(parsed.required).toContain('schemaVersion');
  expect(parsed.properties.schemaVersion.const).toBe('runtime-metadata-v1');
});
```

**Modified Test**: `generateWorkspaceReadme()`
```typescript
test('generateWorkspaceReadme includes all three schemas', () => {
  const readme = generateWorkspaceReadme('test-domain');
  
  expect(readme).toContain('sidecar-config-v1.schema.json');
  expect(readme).toContain('choreography-v1.schema.json');
  expect(readme).toContain('runtime-metadata-v1.schema.json');
});
```

**Modified Test**: `generateAgentFile()`
```typescript
test('generateAgentFile uses choreography diagram terminology', () => {
  const agentFile = generateAgentFile('.');
  
  expect(agentFile).toContain('Choreography Diagram');
  expect(agentFile).toContain('mermaid flowchart');
  expect(agentFile).not.toContain('Sequence Diagram');
});

test('generateAgentFile documents correct build commands', () => {
  const agentFile = generateAgentFile('.');
  
  expect(agentFile).toContain('spas-compose choreography build --docker --dry-run');
  expect(agentFile).toContain('spas-compose choreography build --docker --dev');
  expect(agentFile).toContain('spas-compose choreography build --docker');
});
```

### Integration Tests

**Test**: Full `spas-compose init` workflow
```typescript
test('spas-compose init creates all three schemas', async () => {
  const tempDir = createTempDir();
  
  await executeInit('test-domain', { output: tempDir });
  
  const schemasDir = join(tempDir, 'test-domain', '.spas', 'schemas');
  expect(existsSync(join(schemasDir, 'sidecar-config-v1.schema.json'))).toBe(true);
  expect(existsSync(join(schemasDir, 'choreography-v1.schema.json'))).toBe(true);
  expect(existsSync(join(schemasDir, 'runtime-metadata-v1.schema.json'))).toBe(true);
  
  // Verify runtime metadata schema is valid JSON
  const runtimeSchema = readFileSync(
    join(schemasDir, 'runtime-metadata-v1.schema.json'),
    'utf-8'
  );
  const parsed = JSON.parse(runtimeSchema);
  expect(parsed.$schema).toBe('http://json-schema.org/draft-07/schema#');
});
```

---

## Error Handling

All template functions are pure with no error conditions:
- No file I/O (no `ENOENT` errors)
- No network calls (no timeout/connection errors)
- No user input (no validation errors)

Schema generation uses `JSON.stringify()` on hardcoded object - cannot fail.

Workspace service error handling unchanged - file write errors already handled.
