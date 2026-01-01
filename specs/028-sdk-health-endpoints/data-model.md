# Data Model: Health Endpoints

## Health Status Response

**Schema**: `health-status-v1`

**Description**: Minimal health status response. Open for extension (consumers must ignore unknown properties).

```json
{
  "type": "object",
  "required": ["status"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["UP", "DOWN", "UNKNOWN", "OUT_OF_SERVICE"],
      "description": "The aggregate status of the service."
    }
  },
  "additionalProperties": true
}
```

**Example**:

```json
{
  "status": "UP"
}
```
