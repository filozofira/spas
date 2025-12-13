using System.Reflection;
using System.Text.Json;
using Json.Schema;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Composition;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

public class SchemaValidationTests
{
    private readonly JsonSchema _designTimeSchema;

    public SchemaValidationTests()
    {
        // Load design-time-metadata-v1 schema from embedded resource
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = "Spas.Sdk.Metadata.Tests.Schemas.design-time-metadata-v1.schema.json";
        
        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Embedded resource '{resourceName}' not found");
        using var reader = new StreamReader(stream);
        var schemaJson = reader.ReadToEnd();
        
        _designTimeSchema = JsonSchema.FromText(schemaJson);
    }

    [Fact]
    public void ComposeMetadata_WithMinimalIdentity_ValidatesAgainstDesignTimeSchema()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("payment-service")
            .WithName("Payment Service")
            .WithVersion("1.0.0")
            .WithBoundedContext("Payments")
            .Build();

        // Act
        var metadata = composer.Compose(identity);
        var metadataJson = JsonDocument.Parse(metadata);

        // Assert
        var validationResult = _designTimeSchema.Evaluate(metadataJson, new EvaluationOptions { OutputFormat = OutputFormat.List });
        Assert.True(validationResult.IsValid, $"Schema validation failed: {string.Join(", ", validationResult.Errors?.Select(e => e.ToString()) ?? [])}");
    }

    [Fact]
    public void ComposeMetadata_WithAllBuilders_ValidatesAgainstDesignTimeSchema()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("order-service")
            .WithName("Order Service")
            .WithDescription("Manages order lifecycle")
            .WithVersion("2.1.0")
            .WithBoundedContext("Orders")
            .AddCapability("CreateOrder")
            .AddCapability("QueryOrder")
            .Build();

        var contracts = new ContractsBuilder()
            .AddEndpoint("CreateOrder", "Command", "Http", "POST /api/orders", "1.0", "schemas/create-order.schema.json")
            .AddEndpoint("GetOrder", "Query", "Http", "GET /api/orders/{id}", "1.0", "schemas/get-order.schema.json")
            .AddEvent("OrderCreated", "1.0", "schemas/order-created.schema.json")
            .AddEvent("OrderCancelled", "1.0", "schemas/order-cancelled.schema.json")
            .Build();

        var security = new SecurityBuilder()
            .WithAuthenticationType("OAuth2")
            .AddRequiredScope("orders.write")
            .AddRequiredScope("orders.read")
            .AddDataClassification("Internal")
            .AddDataClassification("Confidential")
            .Build();

        var consistency = new ConsistencyBuilder()
            .WithCommands("ACID")
            .WithQueries("EVENTUAL")
            .Build();

        var network = new NetworkBuilder()
            .AddRequiredEgress("payment-service")
            .AddRequiredEgress("inventory-service")
            .Build();

        // Act
        var metadata = composer.Compose(identity, contracts, security, consistency, network, "MIT");
        var metadataJson = JsonDocument.Parse(metadata);

        // Assert
        var validationResult = _designTimeSchema.Evaluate(metadataJson, new EvaluationOptions { OutputFormat = OutputFormat.List });
        Assert.True(validationResult.IsValid, $"Schema validation failed: {string.Join(", ", validationResult.Errors?.Select(e => e.ToString()) ?? [])}");
    }

    [Fact]
    public void ComposeMetadata_HasRequiredFields()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("test-service")
            .WithName("Test Service")
            .WithVersion("1.0.0")
            .WithBoundedContext("Testing")
            .Build();

        var consistency = new ConsistencyBuilder()
            .WithCommands("ACID")
            .WithQueries("STRONG")
            .Build();

        var network = new NetworkBuilder()
            .AddRequiredEgress("external-api.example.com")
            .Build();

        var security = new SecurityBuilder()
            .AddDataClassification("Public")
            .Build();

        // Act
        var metadata = composer.Compose(identity, null, security, consistency, network);
        var metadataDoc = JsonDocument.Parse(metadata);
        var root = metadataDoc.RootElement;

        // Assert - Check schemaVersion
        Assert.True(root.TryGetProperty("schemaVersion", out var schemaVersion));
        Assert.Equal("design-time-metadata-v1", schemaVersion.GetString());

        // Assert - Check consistency
        Assert.True(root.TryGetProperty("consistency", out var consistencyNode));
        Assert.True(consistencyNode.TryGetProperty("commands", out var commands));
        Assert.Equal("ACID", commands.GetString());
        Assert.True(consistencyNode.TryGetProperty("queries", out var queries));
        Assert.Equal("STRONG", queries.GetString());

        // Assert - Check network.requiredEgress
        Assert.True(root.TryGetProperty("network", out var networkNode));
        Assert.True(networkNode.TryGetProperty("requiredEgress", out var requiredEgress));
        Assert.Equal(JsonValueKind.Array, requiredEgress.ValueKind);
        var egressList = requiredEgress.EnumerateArray().Select(e => e.GetString()).ToList();
        Assert.Contains("external-api.example.com", egressList);

        // Assert - Check security.dataClassification (required)
        Assert.True(root.TryGetProperty("security", out var securityNode));
        Assert.True(securityNode.TryGetProperty("dataClassification", out var dataClassification));
        Assert.Equal(JsonValueKind.Array, dataClassification.ValueKind);
        var classifications = dataClassification.EnumerateArray().Select(c => c.GetString()).ToList();
        Assert.Contains("Public", classifications);
    }

    [Fact]
    public void ComposeMetadata_Endpoints_HaveSchemaRef()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("api-service")
            .WithName("API Service")
            .WithVersion("1.0.0")
            .WithBoundedContext("API")
            .Build();

        var contracts = new ContractsBuilder()
            .AddEndpoint("CreateResource", "Command", "Http", "POST /api/resources", "1.0", "schemas/create-resource.schema.json")
            .AddEndpoint("GetResource", "Query", "Http", "GET /api/resources/{id}", "1.0", "schemas/get-resource.schema.json")
            .Build();

        // Act
        var metadata = composer.Compose(identity, contracts);
        var metadataDoc = JsonDocument.Parse(metadata);
        var root = metadataDoc.RootElement;

        // Assert
        Assert.True(root.TryGetProperty("endpoints", out var endpoints));
        Assert.Equal(JsonValueKind.Array, endpoints.ValueKind);
        
        var endpointList = endpoints.EnumerateArray().ToList();
        Assert.Equal(2, endpointList.Count);

        foreach (var endpoint in endpointList)
        {
            Assert.True(endpoint.TryGetProperty("schemaRef", out var schemaRef));
            Assert.NotNull(schemaRef.GetString());
            Assert.Contains(".schema.json", schemaRef.GetString()!);
        }
    }

    [Fact]
    public void ComposeMetadata_Events_HaveTypeAndSchemaRef()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("event-service")
            .WithName("Event Service")
            .WithVersion("1.0.0")
            .WithBoundedContext("Events")
            .Build();

        var contracts = new ContractsBuilder()
            .AddEvent("ResourceCreated", "1.0", "schemas/resource-created.schema.json")
            .AddEvent("ResourceUpdated", "2.0", "schemas/resource-updated.schema.json")
            .Build();

        // Act
        var metadata = composer.Compose(identity, contracts);
        var metadataDoc = JsonDocument.Parse(metadata);
        var root = metadataDoc.RootElement;

        // Assert
        Assert.True(root.TryGetProperty("events", out var events));
        Assert.Equal(JsonValueKind.Array, events.ValueKind);
        
        var eventList = events.EnumerateArray().ToList();
        Assert.Equal(2, eventList.Count);

        foreach (var evt in eventList)
        {
            Assert.True(evt.TryGetProperty("type", out var type));
            Assert.NotNull(type.GetString());
            
            Assert.True(evt.TryGetProperty("version", out var version));
            Assert.NotNull(version.GetString());
            
            Assert.True(evt.TryGetProperty("schemaRef", out var schemaRef));
            Assert.NotNull(schemaRef.GetString());
            Assert.Contains(".schema.json", schemaRef.GetString()!);
        }
    }

    [Fact]
    public void ComposeMetadata_NoLegacyFields()
    {
        // Arrange
        var composer = new SpasComposer();
        var identity = new ServiceIdentityBuilder()
            .WithId("legacy-check-service")
            .WithName("Legacy Check Service")
            .WithVersion("1.0.0")
            .WithBoundedContext("LegacyCheck")
            .Build();

        var contracts = new ContractsBuilder()
            .AddEndpoint("TestCommand", "Command", "Http", "POST /test", "1.0", "schemas/test.schema.json")
            .Build();

        // Act
        var metadata = composer.Compose(identity, contracts);
        var metadataDoc = JsonDocument.Parse(metadata);
        var root = metadataDoc.RootElement;

        // Assert - Verify legacy fields do NOT exist
        Assert.False(root.TryGetProperty("grpcMethod", out _), "Legacy field 'grpcMethod' should not exist");
        Assert.False(root.TryGetProperty("category", out _), "Legacy field 'category' should not exist");
        Assert.False(root.TryGetProperty("eventsSubscribed", out _), "Legacy field 'eventsSubscribed' should not exist");
        Assert.False(root.TryGetProperty("allowedEgress", out _), "Legacy field 'allowedEgress' should not exist (use 'requiredEgress')");
        
        // Check endpoints don't have legacy fields
        if (root.TryGetProperty("endpoints", out var endpoints))
        {
            foreach (var endpoint in endpoints.EnumerateArray())
            {
                Assert.False(endpoint.TryGetProperty("grpcMethod", out _), "Endpoint should not have 'grpcMethod' field");
                Assert.False(endpoint.TryGetProperty("category", out _), "Endpoint should not have 'category' field");
            }
        }

        // Check security doesn't have 'level' field
        if (root.TryGetProperty("security", out var security))
        {
            Assert.False(security.TryGetProperty("level", out _), "Security should not have 'level' field");
        }
    }
}
