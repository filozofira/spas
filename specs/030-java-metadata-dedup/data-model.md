# Data Model: Java SDK Metadata

## Annotations

### `@SpasService`

**Target**: Type (Class)
**Retention**: Runtime
**Mandatory**: Yes (on Main Application Class)

| Attribute | Type | Description | Mandatory |
| :--- | :--- | :--- | :--- |
| `id` | `String` | The unique identifier of the service (e.g., `order-service`). | Yes |
| `boundedContext` | `String` | The bounded context the service belongs to (e.g., `sales`). | Yes |
| `version` | `String` | The semantic version of the service (e.g., `1.0.0`). | Yes |

## Configuration Properties

The annotation values map directly to the following Spring Boot configuration properties:

| Property Key | Source Attribute | Description |
| :--- | :--- | :--- |
| `spas.service.id` | `@SpasService.id` | Service Identifier |
| `spas.service.bounded-context` | `@SpasService.boundedContext` | Bounded Context Name |
| `spas.service.version` | `@SpasService.version` | Service Version |

## Precedence Model

(Highest Priority - First Match Wins)
1. Command Line Arguments
2. `SPRING_APPLICATION_JSON`
3. `ConfigData` (application.yml/properties)
4. ...
5. **`SpasServiceAnnotationPropertySource`** (New)
6. Default Properties
