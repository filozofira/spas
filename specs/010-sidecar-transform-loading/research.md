# Research: Sidecar Transform File Loading

**Date**: 2025-12-16  
**Spec**: [spec.md](spec.md)  
**Status**: Complete

## Research Tasks

### 1. JSONata File Loading Pattern

**Question**: How should we load and compile JSONata expressions from files?

**Decision**: Use synchronous file loading with async compilation caching

**Rationale**:
- JSONata expressions are small text files (typically <1KB)
- Synchronous `fs.readFileSync` is acceptable for startup/first-use loading
- Async evaluation is already used (`expression.evaluate()` returns Promise)
- The existing cache mechanism (`Map<string, jsonata.Expression>`) can be reused

**Alternatives Considered**:
1. Async file loading (`fs.promises.readFile`) - Adds complexity for minimal benefit on small files
2. Pre-loading all transforms at startup - Requires knowing all paths upfront, breaks lazy loading
3. Watching for file changes - Out of scope for PoC, adds complexity

**Implementation Pattern**:
```typescript
import { readFileSync } from 'fs';
import jsonata from 'jsonata';

function isFilePath(transform: string): boolean {
  return transform.endsWith('.jsonata');
}

function loadTransformContent(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

async function applyTransform(payload: unknown, transform: string): Promise<unknown> {
  if (!transform) return payload;
  
  let expression = transformCache.get(transform);
  if (!expression) {
    const content = isFilePath(transform) 
      ? loadTransformContent(transform) 
      : transform;
    expression = jsonata(content);
    transformCache.set(transform, expression);
  }
  
  return expression.evaluate(payload);
}
```

---

### 2. File Path Detection Strategy

**Question**: How do we distinguish file paths from inline expressions?

**Decision**: Use `.jsonata` extension as the indicator

**Rationale**:
- Clear, unambiguous convention
- Matches the file format used in choreography (`*.jsonata` files)
- Aligns with existing spas-compose sidecar config generator
- Simple string check: `transform.endsWith('.jsonata')`

**Alternatives Considered**:
1. Check if file exists - Expensive I/O for every transform, fails if file is missing
2. Use prefix like `file:` - Requires config format change, breaks existing configs
3. Check for path separators (`/`, `\`) - Ambiguous, valid JSONata can contain these

---

### 3. Error Handling Strategy

**Question**: How should file loading/parsing errors be handled?

**Decision**: Throw descriptive errors that bubble up to reject the event

**Rationale**:
- Per clarification: "Reject the event and return an error response (fail explicitly)"
- Errors should identify the file path and the specific failure
- Existing error handling in callers (event-subscriber, event-publisher) already catches and surfaces errors

**Error Categories**:
1. **File not found**: `Transform file not found: ${filePath}`
2. **File read error**: `Failed to read transform file ${filePath}: ${error.message}`
3. **Invalid JSONata syntax**: `Invalid JSONata in ${filePath}: ${error.message}`

---

### 4. Caching Strategy

**Question**: Should we cache file content separately from compiled expressions?

**Decision**: No - cache only compiled expressions, keyed by file path

**Rationale**:
- File content is only needed for compilation
- Compiled expressions are what we reuse
- Memory efficient: one cache, not two
- Existing `transformCache` already works this way

**Cache Key Strategy**:
- For inline expressions: the expression string itself
- For file paths: the file path string (unchanged)
- This means same content in different files = different cache entries (acceptable)

---

### 5. Path Resolution

**Question**: How should relative paths be resolved?

**Decision**: Resolve relative to `process.cwd()` (sidecar working directory)

**Rationale**:
- In Docker, working directory is typically `/app`
- Transform files are mounted alongside config
- Consistent with how Node.js resolves relative paths
- No need for additional configuration

**Implementation**:
```typescript
import { resolve } from 'path';

function resolveTransformPath(filePath: string): string {
  // If already absolute, use as-is
  if (path.isAbsolute(filePath)) return filePath;
  // Otherwise resolve from cwd
  return resolve(process.cwd(), filePath);
}
```

---

### 6. EventPublisher Transform Consolidation

**Question**: EventPublisher has its own placeholder `applyTransform` - should we consolidate?

**Decision**: Yes - use the shared `transformer.ts` implementation

**Rationale**:
- The placeholder was marked "Transform will be implemented in T026 (Phase 5)"
- Having two implementations would violate DRY
- Shared cache benefits all transform users
- Consistent error handling across inbound and outbound

**Files Affected**:
- `event-publisher.ts`: Import and use `applyTransform` from `transformer.ts`
- Remove the private `applyTransform` placeholder method

---

## Summary

| Decision | Choice |
|----------|--------|
| File detection | `.jsonata` extension check |
| File loading | Synchronous `readFileSync` |
| Path resolution | Relative to `process.cwd()` |
| Caching | Compiled expressions only, keyed by path/expression |
| Error handling | Throw descriptive errors, reject events |
| EventPublisher | Consolidate to use shared transformer |

## References

- [JSONata Documentation](https://docs.jsonata.org/)
- [Node.js fs module](https://nodejs.org/api/fs.html)
- Current implementation: `components/sidecar/src/services/transformer.ts`
