# SPAS SDK Sample Service (.NET)

Runnable reference implementation for the .NET SDK.

## Quick start

Prereqs: .NET 10 SDK.

```bash
cd components/sdk/dotnet/examples/SampleService

# Required
export SERVICE_NAME=sample-service

# Sidecar connection (adjust for your environment)
export SIDECAR_HOST=localhost
export SIDECAR_PORT=3500

# Optional
export ZIPKIN_URL=http://localhost:9411

dotnet run
```

Verify dev metadata endpoint:

```bash
curl http://localhost:5000/_spas/metadata -o metadata.zip
```

