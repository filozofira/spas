# .NET SDK Configuration Guide - Common Issues

## Issue: Sidecar Connection Failures

### Symptoms
```
System.Net.Http.HttpRequestException: Name or service not known (spas-sidecar-{service}:7000)
System.Net.Sockets.SocketException: Name or service not known
```

### Root Cause
Incorrect or missing sidecar configuration in `appsettings.json`.

### ❌ Incorrect Configuration
```json
{
  "SIDECAR_URL": "http://spas-sidecar-subscription:7000",
  "ZIPKIN_URL": "http://spas-zipkin:9411"
}
```

### ✅ Correct Configuration
```json
{
  "Spas": {
    "ServiceName": "subscription-service",
    "Sidecar": {
      "Host": "subscription-service-sidecar",
      "Port": 7000
    },
    "Zipkin": {
      "Url": "http://zipkin:9411"
    }
  }
}
```

### Key Points
1. **Use structured configuration**: `Spas:Sidecar:Host` NOT flat `SIDECAR_URL`
2. **Sidecar hostname convention**: `{service-name}-sidecar` (matches docker-compose service name)
3. **Port**: Default is 7000, must match sidecar configuration
4. **Environment variables override**: Docker compose `SIDECAR_URL` env var will NOT override missing `Spas:Sidecar` config

### Prevention
When creating a new SPAS service:
1. Copy `appsettings.json` from an existing reference service (order-service, inventory-service)
2. Update only the `ServiceName` field
3. Ensure `Spas:Sidecar:Host` matches your service name pattern

### Future Enhancement Request
SDK should log a warning when `Spas:Sidecar:Host` configuration is missing, making misconfigurations immediately visible during startup.

---
**Issue Logged**: 2025-12-18  
**Affected Component**: SPAS .NET SDK  
**Severity**: Medium (causes runtime failure but easy to fix once identified)
