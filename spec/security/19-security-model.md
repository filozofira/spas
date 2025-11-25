# Security Model

Defines security principles for SPAS services and platform.

## Principles

- Zero-trust by default
- Defense in depth (edge, sidecar/mesh, runtime)
- Least privilege and default deny

## Threat Model (High Level)

- Network egress abuse
- Identity spoofing and token leakage
- Schema drift causing deserialization issues
- Supply chain tampering

## PoC vs Production

- PoC: Declarative policies in metadata; limited enforcement
- Production: Enforced by sidecar/mesh and platform policies
