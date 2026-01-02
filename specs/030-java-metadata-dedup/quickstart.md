# Quickstart: Java Service Configuration

## 1. Add Dependency

Ensure you have the SPAS Spring Boot Starter:

```xml
<dependency>
    <groupId>io.spas</groupId>
    <artifactId>spas-sdk-spring</artifactId>
    <version>${spas.version}</version>
</dependency>
```

## 2. Annotate Main Class

Add the `@SpasService` annotation to your main application class. This is now the **Single Source of Truth** for your service identity.

```java
package com.example.orders;

import io.spas.sdk.metadata.annotation.SpasService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@SpasService(
    id = "order-service",
    boundedContext = "sales",
    version = "1.0.0"
)
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

## 3. ✅ Configuration Complete

**That's it!** Your service identity is now defined in code via the `@SpasService` annotation.

**Do NOT add `spas.service.*` properties to `application.yml`** - they are redundant and unnecessary. The SDK's metadata generation reads service identity directly from the annotation.

```yaml
# application.yml - Service identity is NOT needed here
spring:
  application:
    name: order-service

# SPAS sidecar configuration (if needed)
spas:
  sidecar:
    url: http://localhost:7000
```

## 4. Advanced: Runtime Overrides (Optional)

## 4. Advanced: Runtime Overrides (Optional)

If you need to override service identity at runtime (e.g., for testing or CI/CD), use `SpasServiceOptions` in your main method:

```bash
export SPAS_SERVICE_VERSION=1.0.1-SNAPSHOT
java -jar order-service.jar
```
