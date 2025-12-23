# Security Policy

## Supported Versions

SPAS is currently a **Proof of Concept** under active development. Security fixes will be applied to the latest version only.

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| others  | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in SPAS, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Email the maintainers directly or use GitHub's private vulnerability reporting feature.
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to provide a fix or mitigation within 14 days for critical issues.

## Security Considerations

As a PoC, SPAS has known limitations:

- **No production hardening** — See [specs/001-dotnet-spas-sdk/SECURITY.md](./specs/001-dotnet-spas-sdk/SECURITY.md) for SDK-specific notes.
- **Development defaults** — Default configurations prioritize ease of use over security.
- **No formal security audit** — The codebase has not undergone third-party security review.

Review the [Security Model](./principles/security/19-security-model.md) for the intended production security architecture.
