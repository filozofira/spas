using System.Linq;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Composition;
using Spas.Sdk.Metadata.Extensions;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

public class ProducedEventsTests
{
    [Fact]
    public void DiscoverSpasMetadata_WhenCommandProducesEvent_EmitsCommandsWithProducesInSpasJson()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(ProducedEventsTests).Assembly);
            options.AutoGenerateSchemaReferences = true;
        });

        using var app = builder.Build();

        app.MapPost("/commands/create-order", () => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0")
            {
                Produces = new[] { typeof(TestOrderCreatedEvent) }
            });

        var identity = new ServiceIdentityBuilder()
            .WithId("test-service")
            .WithName("test-service")
            .WithVersion("1.0.0")
            .WithBoundedContext("test")
            .Build();

        // Act
        var contracts = app.DiscoverSpasMetadata();
        var json = new SpasComposer().Compose(identity, contracts);

        // Assert
        using var doc = JsonDocument.Parse(json);

        var endpoints = doc.RootElement.GetProperty("endpoints").EnumerateArray().ToList();
        Assert.Single(endpoints);
        Assert.Equal("create-order", endpoints[0].GetProperty("name").GetString());
        Assert.Equal("schemas/endpoints/create-order.schema.json", endpoints[0].GetProperty("schemaRef").GetString());

        var commands = doc.RootElement.GetProperty("commands").EnumerateArray().ToList();
        Assert.Single(commands);

        var cmd = commands[0];
        Assert.Equal("create-order", cmd.GetProperty("name").GetString());

        var produces = cmd.GetProperty("produces").EnumerateArray().ToList();
        Assert.Single(produces);

        var produced = produces[0];
        Assert.Equal("order-created", produced.GetProperty("type").GetString());
        Assert.Equal("1.0", produced.GetProperty("version").GetString());
        Assert.Equal("success", produced.GetProperty("when").GetString());
    }

    [Fact]
    public void DiscoverSpasMetadata_WhenProducesContainsDuplicates_Throws()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(ProducedEventsTests).Assembly);
            options.AutoGenerateSchemaReferences = true;
        });

        using var app = builder.Build();

        app.MapPost("/commands/create-order", () => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0")
            {
                Produces = new[] { typeof(TestOrderCreatedEvent), typeof(TestOrderCreatedEvent) }
            });

        // Act / Assert
        var ex = Assert.Throws<InvalidOperationException>(() => app.DiscoverSpasMetadata());
        Assert.Contains("duplicate produced event", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void DiscoverSpasMetadata_WhenProducedEventMissingSpasEventAttribute_Throws()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(ProducedEventsTests).Assembly);
            options.AutoGenerateSchemaReferences = true;
        });

        using var app = builder.Build();

        app.MapPost("/commands/create-order", () => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0")
            {
                Produces = new[] { typeof(MissingSpasEventAttributeEvent) }
            });

        // Act / Assert
        var ex = Assert.Throws<InvalidOperationException>(() => app.DiscoverSpasMetadata());
        Assert.Contains("missing [SpasEvent]", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void DiscoverSpasMetadata_WhenProducedEventNotDeclaredInEvents_Throws()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            // Intentionally scan an assembly that does NOT contain TestOrderCreatedEvent,
            // so events[] won't include the produced event (type, version).
            options.AssembliesToScan.Add(typeof(string).Assembly);
            options.AutoGenerateSchemaReferences = true;
        });

        using var app = builder.Build();

        app.MapPost("/commands/create-order", () => Results.Ok())
            .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0")
            {
                Produces = new[] { typeof(TestOrderCreatedEvent) }
            });

        // Act / Assert
        var ex = Assert.Throws<InvalidOperationException>(() => app.DiscoverSpasMetadata());
        Assert.Contains("no matching entry exists in events", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}

// Test event types
[SpasEvent("OrderCreated", "1.0")]
public record TestOrderCreatedEvent;

public record MissingSpasEventAttributeEvent;
