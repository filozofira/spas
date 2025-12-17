# Feature grooming

List of features to discuss before deciding to implement, here referred to as "Features".
All Features should be listed here to ensure AI agents have easy access to it.

- Features are enumerated for reference only and not priority-wise
- Features should not drive implementation decisions of other PoC/Production ready features unless strongly justified.
- G-Feature description as least can contain following parts:
  1. Must-have a brief description outlining what feature is about.
  1. Nice-to-have examples and perhaps even code snippets etc.
  1. Must-have justification or why implement the feature.

## F01: Add State element to Service Metadata

Add StateStore or State element to spas.json, design-time and runtime.

**StateStore design-time example:**

```json
{
  "schemaVersion": "design-time-metadata-v1",
  "id": "test-service",
  "name": "Test Service",
  //...
  "network": {
    "requiredEgress": [],
    "requiredStateStore": {
      "imageDigest": "sha256:abc123...",
      "imageRepository": "postgres",
      "imageTag": "15.15-trixie"
    }
  },
  "security": {
    //...
  },
  "license": "MIT"
}
```

**Justification:** Adding StateStore to spas.json can enable following improvements:

- Allow spas-compose CLI to add these dependencies to docker-compose file and hence allow one command to bootstrap full domain with all dependencies.
- Visualises full network dependencies required by service to operate.

### F02: Cross Domain Choreography

Extend framework to support choreographies across multiple domain contexts.

**Justification:** Adding this feature would allow domain composers to integrate multiple domains into one SPAS solution, allowing data to flow/synchronise across these boundaries. E.g. admin-e-commerce and public-e-commerce domain contexts can synchronise products, stock related data and similar.

## F03: SDK Metadata extraction

Consider swapping `_spas/metadata` endpoint with cli based extraction of metadata archive.
E.g. extend SDK to support writing metadata to file (e.g. already implemented in SampleService `SpasComposer.ComposeToFile(...)`) when running app with certain arguments.

SDK be extended to allow something similar to following startup code in Program.cs

```csharp
var arguments = string.Join(' ', args);
if (arguments.Contains("--generate-metadata"))
{
    //TODO: Code to discover, generate and save metadata to disk.
    Console.WriteLine($"SPAS metadata generated at: some/path/SampleService.metadata.zip");
    return;
}

Console.WriteLine("Normal startup.");
//TODO: normal startup
```

Given above SDK and service startup code, developer can run below commands.

```bash
# To output meta data and exit
dotnet run -- --generate-metadata

# Normal startup
dotnet run
```

**Justification:** Above solution provides several benefits:

- Improves service startup time, since metadata discovery will run only on local machine.
- Allows easier integration with CI/CD pipelines to build and publish service metadata to SPAS Repository automatically.
- Would simplify spas-service publishing since there is no need to wait for developer to start service any more.
