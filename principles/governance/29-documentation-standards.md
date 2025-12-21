# Documentation Standards

## Purpose

Maintain consistent, maintainable documentation across all SPAS components by separating concerns between users and contributors, avoiding drift-prone content, and establishing clear patterns for documentation organization.

## Audience Separation Principle

**Problem**: Mixed-audience documentation leads to:

- Users overwhelmed by internal development details
- Contributors unable to find maintenance procedures
- Drift-prone claims (test counts, status updates, versions) that quickly become outdated

**Solution**: Separate documentation by audience with clear file conventions.

### README.md - User-Facing

**Audience**: Service developers using the component (SDK users, CLI users, service integrators)

**Required Sections**:

- Overview: What this component does, when to use it
- Installation/Getting Started: How to install and run basic usage
- Configuration: Key settings and options
- Examples: Practical usage patterns
- API/Reference: Public interfaces (link to detailed docs)

**Content Guidelines**:

- ✅ Installation commands and prerequisites
- ✅ Quickstart examples with expected output
- ✅ Configuration options with defaults
- ✅ Links to specs, principles, and API docs
- ✅ Common usage patterns and recipes
- ❌ Build/test procedures (belongs in CONTRIBUTING.md)
- ❌ Project structure details (belongs in CONTRIBUTING.md)
- ❌ Status updates ("currently supports X features")
- ❌ Test counts, coverage percentages, version lists
- ❌ Dates, "last updated" timestamps
- ❌ Internal architecture deep-dives (link to specs instead)

**Rationale**: READMEs are the entry point for users. Focus on getting started quickly. Avoid claims that require constant updates.

### CONTRIBUTING.md - Maintainer-Facing

**Audience**: Developers contributing to the component itself

**Required Sections** (Standard Structure):

1. **Prerequisites**: Dev environment setup (tools, versions, accounts)
2. **Getting Started**: Clone, install dependencies, initial build
3. **Project Structure**: Directory layout, key files, architectural decisions
4. **Making Changes Safely**: Where to add features, compatibility rules
5. **Testing**: How to run tests, write new tests, debug failures
6. **Pull Request Checklist**: Pre-submission validation steps
7. **References**: Links to specs, related components, decision logs

**Content Guidelines**:

- ✅ Build and test commands with expected output
- ✅ Development workflow (watch mode, debugging)
- ✅ Project structure with explanations
- ✅ How to add new features (step-by-step)
- ✅ Testing strategies and debugging tips
- ✅ Breaking change policies and migration responsibilities
- ✅ PR checklist with concrete validation steps
- ❌ Basic usage examples (belongs in README.md)
- ❌ Public API documentation (belongs in README.md or external docs)

**Rationale**: Contributors need deep context. Include everything required to modify the component confidently.

### CONVENTIONS.md - Shared Cross-Component Rules

**Audience**: Both users and contributors across multiple related components

**When to Create**:

- Rules apply to multiple implementations (e.g., all SDK languages)
- Consistency is critical across components (e.g., event naming, schema patterns)
- One source of truth prevents divergence

**Examples**:

- `components/sdk/CONVENTIONS.md`: Event naming, schema references, SDK/sidecar boundaries
- `components/cli/CONVENTIONS.md` (if needed): Command naming, config file formats, error codes

**Content Guidelines**:

- ✅ Rules that apply across all implementations
- ✅ Rationale for each convention (why, not just what)
- ✅ Examples showing compliant vs non-compliant patterns
- ✅ Links to specs or principles that define the rules
- ❌ Implementation details specific to one language/tool
- ❌ Step-by-step tutorials (belongs in READMEs or CONTRIBUTING.md)

**Rationale**: One canonical source prevents drift. New implementations inherit correct patterns.

## Drift-Prone Content to Avoid

These items change frequently and cause documentation maintenance burden:

### In All Documentation

❌ **Test Counts**: "Currently 247 tests" → outdated after next PR  
✅ **Alternative**: "Comprehensive test suite covering all public APIs"

❌ **Coverage Percentages**: "87% code coverage" → fluctuates with each change  
✅ **Alternative**: Link to CI dashboard or simply "See test results in CI"

❌ **Version Lists**: "Supports .NET 8, 9, 10" → outdated when .NET 11 releases  
✅ **Alternative**: "Supports .NET 8+" or link to package manifest

❌ **Dates**: "Last updated: December 2025" → maintenance burden  
✅ **Alternative**: Git history provides this automatically

❌ **Status Claims**: "Currently supports gRPC and REST" → becomes outdated  
✅ **Alternative**: Link to feature list in specs or use SDK metadata

❌ **Hard-Coded Versions**: "Install version 1.2.3" → requires manual updates  
✅ **Alternative**: "Install the latest version" or use package manager defaults

❌ **Commented Legacy Blocks**: `<!-- Old approach: ... -->` → confuses readers  
✅ **Alternative**: Delete entirely; Git history preserves old versions

### Exception: When Dynamic Content Is Acceptable

- **API documentation generated from code**: OpenAPI specs, TypeDoc, Javadoc (auto-generated, not manually maintained)
- **Changelogs**: CHANGELOG.md with explicit version history (expected to grow)
- **Migration guides**: Dated guides for specific version transitions (historical record)

## Cross-Cutting Documentation Patterns

### Linking Strategy

**Prefer linking over duplicating**:

- ✅ "See [Communication Model](../../principles/protocol/07-communication-model.md) for protocol details"
- ❌ Copy-pasting protocol details into component READMEs

**Link targets**:

- Specs (`specs/`) for implementation requirements
- Principles (`principles/`) for architectural rationale
- Other component READMEs for integration points
- External docs (GitHub, package registries) for third-party tools

### Examples and Samples

**README.md**: Inline code snippets (5-15 lines) showing typical usage  
**examples/** directory**: Complete working projects demonstrating real-world scenarios  
**CONTRIBUTING.md\*\*: Code snippets showing how to extend the component

### Versioning Documentation

- Documentation lives with code (same repo, same version)
- Breaking changes require migration guide in spec or CHANGELOG
- Deprecated features noted with removal timeline + link to alternative

## AI Agent Guidance

When AI assistants work on SPAS documentation:

1. **Before editing any README.md**: Check if content is user-facing or contributor-facing. Move contributor content to CONTRIBUTING.md if missing.

2. **Avoid adding drift-prone content**: No test counts, coverage percentages, hard-coded versions, or status claims.

3. **Prefer linking**: Don't duplicate content from specs or principles. Link instead.

4. **Follow standard structures**: Use the section order defined above for CONTRIBUTING.md files.

5. **Check for commented legacy blocks**: Remove any `<!-- ... -->` blocks during documentation updates.

6. **Validate links**: Ensure all cross-references use correct relative paths from workspace root.

## Validation Checklist

Before merging documentation changes:

- [ ] README.md contains no build/test procedures (check CONTRIBUTING.md instead)
- [ ] CONTRIBUTING.md follows standard 7-section structure
- [ ] No test counts, coverage percentages, or hard-coded versions
- [ ] No commented legacy blocks (`<!-- ... -->`)
- [ ] All cross-references use correct relative paths
- [ ] Code examples are minimal and focused (not full applications)
- [ ] Drift-prone claims replaced with links or removed
- [ ] User/contributor content properly separated

## Related Documents

- [Versioning Strategy](./23-versioning-strategy.md) - How versions evolve
- [Compliance Checklist](./24-compliance-checklist.md) - Service compliance requirements
- [Evolution Policy](./25-evolution-policy.md) - How SPAS framework evolves
- [Decision Log](../appendix/28-decision-log.md) - Architectural decisions
