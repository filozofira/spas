# Compliance Checklist

A SPAS-compliant service satisfies:

- [ ] Single bounded context
- [ ] No synchronous cross-context dependencies
- [ ] Valid `spas.json` metadata
- [ ] gRPC service definition
- [ ] Event contracts (published/subscribed)
- [ ] OCI image available
- [ ] Health endpoints implemented
- [ ] Declared idempotency strategy
- [ ] Declared consistency model (commands ACID; queries MAY be eventual)
- [ ] Security requirements met
- [ ] Observability hooks in place
- [ ] Documentation complete

Tooling: `spas validate` performs automated checks where possible.

## Related Documents

- [Versioning Strategy](23-versioning-strategy.md)
- [Service Metadata](../service-specification/06-service-metadata.md)
- [Repository Specification](../infrastructure/13-repository-spec.md)
