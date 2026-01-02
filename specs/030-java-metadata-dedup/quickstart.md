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

## 3. Clean `application.yml`

You can now **remove** the redundant service definition from your `application.yml`:

```yaml
# BEFORE
spas:
  service:
    id: order-service          # REMOVE
    bounded-context: sales     # REMOVE
    version: 1.0.0             # REMOVE

# AFTER
spring:
  application:
    name: order-service
```

## 4. Overrides (Optional)

If you need to override the version for a specific environment (e.g., in a CI/CD pipeline), you can still use environment variables or configuration files:

```bash
export SPAS_SERVICE_VERSION=1.0.1-SNAPSHOT
java -jar order-service.jar
```
