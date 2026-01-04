# Contributing to SPAS

Thank you for your interest in contributing to SPAS!

## AI-Assisted Development

Most of the SPAS framework and examples were built using **AI-assisted development** with GitHub Copilot, guided by a structured specification workflow called **SpecKit**.

### How It Works

The development process is governed by the [SPAS Framework Constitution](./.specify/memory/constitution.md), which establishes non-negotiable principles, component quality gates, and governance rules. The constitution references detailed [Principles](./principles/README.md) that serve a dual audience:

> **Developers** seeking architectural clarity and **AI agents** requiring precise constraints. This eliminates ambiguity during development, enabling high-fidelity code generation while ensuring both human and automated contributors align with the framework's core design.

### SpecKit Workflow

When building features, we follow a structured workflow:

1. **Specify** (`/speckit.specify`) — Define user stories, requirements, and success criteria
2. **Clarify** (`/speckit.clarify`) — Resolve ambiguities with Q&A
3. **Plan** (`/speckit.plan`) — Create implementation plan with constitution checks
4. **Tasks** (`/speckit.tasks`) — Break down into actionable implementation tasks
5. **Implement** (`/speckit.implement`) — Execute tasks phase by phase

This approach ensures AI-generated code adheres to framework principles and maintains consistency across components.

### Key Documents

| Document | Purpose |
|----------|---------|
| [Constitution](./.specify/memory/constitution.md) | Governance, universal rules, quality gates |
| [Principles](./principles/README.md) | Technical specifications for all components |
| [Decision Log](./principles/appendix/28-decision-log.md) | Architecture Decision Records (ADRs) |

---

## Getting Started

SPAS is organized into independent components, each with its own contribution guide:

### SDKs

- [.NET SDK](./components/sdk/dotnet/CONTRIBUTING.md) — .NET 10.0, C#
- [Java SDK](./components/sdk/java/CONTRIBUTING.md) — Java 25+, Maven

### CLI Tools

- [spas-service](./components/cli/spas-service/CONTRIBUTING.md) — Service metadata publishing
- [spas-compose](./components/cli/spas-compose/CONTRIBUTING.md) — Domain choreography composition

### Runtime Components

- [Repository](./components/repository/CONTRIBUTING.md) — Service metadata registry
- [Sidecar](./components/sidecar/CONTRIBUTING.md) — Event routing and transformation

## Types of Contributions

### Bug Reports

Open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, runtime versions)

### Feature Requests

Open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered

### Code Contributions

1. Fork the repository
2. Create a feature branch from `main`
3. Follow the component-specific contribution guide
4. Ensure tests pass
5. Submit a pull request

## Architecture & Governance

For changes to framework principles, protocols, or cross-cutting concerns:

- Review [Principles](./principles/README.md)
- Check the [Decision Log](./principles/appendix/28-decision-log.md) for prior decisions
- Open a discussion before submitting major changes

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before participating.

## Questions?

Open a discussion or issue — we're happy to help!
