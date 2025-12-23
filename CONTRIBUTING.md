# Contributing to SPAS

Thank you for your interest in contributing to SPAS!

## Getting Started

SPAS is organized into independent components, each with its own contribution guide:

### SDKs

- [.NET SDK](./components/sdk/dotnet/CONTRIBUTING.md) — .NET 10.0, C#
- [Java SDK](./components/sdk/java/CONTRIBUTING.md) — Java 17+, Maven

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
