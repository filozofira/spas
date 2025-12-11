# Compliance Checklist

## Machine-Verified Items

- [ ] Valid `spas.json` metadata (schema passes)
- [ ] Service definition present (Production: gRPC proto, PoC: HTTP endpoints/OpenAPI)
- [ ] Event contracts listed (`eventsPublished[]`, `eventsSubscribed[]`)
- [ ] OCI image reference present
- [ ] Health endpoint declaration present
- [ ] Consistency fields valid (`commands=ACID`, `queries` enum)
- [ ] Idempotency strategy enum valid (if present)
- [ ] Network enclosure + allowedEgress format valid
- [ ] Data classification values in allowed set

## Advisory / Conceptual Items

- [ ] Single bounded context (conceptual; cannot be strictly validated)
- [ ] No synchronous cross-context dependencies (design review)
- [ ] Appropriate idempotency implementation (code review)
- [ ] Security hardening applied (secrets management, least privilege)
- [ ] Observability hooks emit required signals
- [ ] Documentation complete

Tooling: `spas validate` performs machine-verified checks; advisory items appear as INFO.

## Related Documents

- [Versioning Strategy](23-versioning-strategy.md)
- [Service Metadata](../service-specification/06-service-metadata.md)
- [Repository Specification](../component-specification/12-repository-spec.md)
