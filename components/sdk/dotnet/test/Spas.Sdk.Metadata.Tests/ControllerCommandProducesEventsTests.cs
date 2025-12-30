using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Metadata.Tests.Fixtures;
using Xunit;

namespace Spas.Sdk.Metadata.Tests;

/// <summary>
/// Unit tests for Produces property on [SpasCommand] for controller actions (T025 - US4).
/// Verifies that controllers can declare event production via Produces property.
/// </summary>
public class ControllerCommandProducesEventsTests
{
    [Fact]
    public void DiscoverSpasMetadata_CommandWithSingleProducedEvent_IncludesEventInCommandContract()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(CommandProducesEventsController).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(CommandProducesEventsController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - Verify command exists
        var createOrderCommand = contracts.Commands.FirstOrDefault(c => c.Name == "create-order-command");
        Assert.NotNull(createOrderCommand);

        // Verify Produces contains the event
        Assert.NotNull(createOrderCommand.Produces);
        Assert.Single(createOrderCommand.Produces);
        
        var producedEvent = createOrderCommand.Produces.First();
        Assert.Equal("order-created", producedEvent.Type);
        Assert.Equal("1.0", producedEvent.Version);
    }

    [Fact]
    public void DiscoverSpasMetadata_CommandWithMultipleProducedEvents_IncludesAllEventsInCommandContract()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(CommandProducesEventsController).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(CommandProducesEventsController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - Verify command exists
        var confirmOrderCommand = contracts.Commands.FirstOrDefault(c => c.Name == "confirm-order-command");
        Assert.NotNull(confirmOrderCommand);

        // Verify Produces contains multiple events
        Assert.NotNull(confirmOrderCommand.Produces);
        Assert.Equal(2, confirmOrderCommand.Produces.Count);
        
        var eventTypes = confirmOrderCommand.Produces.Select(e => e.Type).ToList();
        Assert.Contains("order-confirmed", eventTypes);
        Assert.Contains("inventory-reserved", eventTypes);
    }

    [Fact]
    public void DiscoverSpasMetadata_CommandWithoutProduces_HasNullOrEmptyProduces()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(CommandProducesEventsController).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(CommandProducesEventsController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - Verify command exists
        var cancelOrderCommand = contracts.Commands.FirstOrDefault(c => c.Name == "cancel-order-command");
        Assert.NotNull(cancelOrderCommand);

        // Verify Produces is null or empty
        Assert.True(cancelOrderCommand.Produces == null || cancelOrderCommand.Produces.Count == 0);
    }

    [Fact]
    public void DiscoverSpasMetadata_ProducedEventsWithSpasEventAttribute_DiscoversEventMetadata()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddSpasMetadata(options =>
        {
            options.AssembliesToScan.Add(typeof(CommandProducesEventsController).Assembly);
        });
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(CommandProducesEventsController).Assembly);
        
        var app = builder.Build();
        app.MapControllers();

        // Act
        var contracts = app.DiscoverSpasMetadata();

        // Assert - Verify event metadata is discovered
        var orderCreatedEvent = contracts.Events.FirstOrDefault(e => e.Type == "order-created");
        Assert.NotNull(orderCreatedEvent);
        Assert.Equal("1.0", orderCreatedEvent.Version);
        
        var orderConfirmedEvent = contracts.Events.FirstOrDefault(e => e.Type == "order-confirmed");
        Assert.NotNull(orderConfirmedEvent);
        
        var inventoryReservedEvent = contracts.Events.FirstOrDefault(e => e.Type == "inventory-reserved");
        Assert.NotNull(inventoryReservedEvent);
    }
}
