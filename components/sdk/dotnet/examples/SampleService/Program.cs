using Spas.Sdk.Core.Identity;
using Spas.Sdk.Events.Publish;
using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Extensions;
using Spas.Sdk.Observability.Extensions;
using Spas.Sdk.Observability.Tracing;

var builder = WebApplication.CreateBuilder(args);

// Register SPAS metadata services with auto-discovery
builder.Services.AddSpasMetadata(options =>
{
    options.AssembliesToScan.Add(typeof(Program).Assembly);
    options.AutoGenerateSchemaReferences = true;
});

// Configure all SPAS infrastructure services (event publishing, tracing)
// Reads: SERVICE_NAME, SIDECAR_HOST, SIDECAR_PORT (or SIDECAR_URL), ZIPKIN_URL
var serviceName = builder.Services.AddSpasServices(builder.Configuration, "sample-service");

var app = builder.Build();

// Enable SPAS identity middleware to populate SpasContext from HTTP context
app.UseSpasIdentity();

// Enable SPAS tracelog middleware for request/response timing and correlation
app.UseSpasTracelog();

// Define endpoints with SPAS attributes - contracts auto-discovered!
app.MapPost("/commands/create-order",
    async (CreateOrderRequest request, EventPublisher publisher) =>
    {
        var orderId = Guid.NewGuid();

        // Create the order (simulate business logic)
        var result = new { orderId, status = "created" };

        // Publish OrderCreated event - SDK sends only payload + context headers
        // Sidecar will wrap this in CloudEvents envelope
        var eventPayload = new
        {
            orderId,
            customerId = request.CustomerId,
            total = request.Total,
            createdAt = DateTime.UtcNow
        };

        try
        {
            // Generic API: event type derived from [SpasEvent] attribute on OrderCreatedEvent
            // SDK automatically includes headers: traceparent, x-service-name, x-event-type, x-correlation-id, x-user-id, x-tenant-id
            // Sidecar handles topic routing based on event type configuration
            await publisher.PublishAsync<OrderCreatedEvent>(payload: eventPayload);
        }
        catch (Exception ex)
        {
            // Log but don't fail the request if event publishing fails
            Console.WriteLine($"Failed to publish event: {ex.Message}");
        }

        return Results.Ok(result);
    })
    .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0")
    {
        Produces = new[] { typeof(OrderCreatedEvent) }
    });

app.MapGet("/queries/get-order/{id}",
    (Guid id) =>
    {
        return Results.Ok(new GetOrderResponse(id, "completed", 99.99m));
    })
    .WithMetadata(new SpasQueryAttribute("GetOrder", "1.0"));

app.MapGet("/", () => "Hello from SPAS Sample Service!");

app.MapGet("/health", () => new { status = "healthy", timestamp = DateTime.UtcNow });

// Run SPAS service (generates metadata if --generate-metadata, else starts server)
await app.RunSpasServiceAsync(args, options =>
{
    options.ServiceId = "sample-service";
    options.ServiceName = "sample-service";
    options.Version = "1.0.1";
    options.BoundedContext = "samples";
    options.Description = "Sample SPAS service demonstrating SDK usage";
    options.AddCapability("create-order");
    options.AddCapability("query-order");

    // Placeholder metadata (same as other examples)
    options.ConfigureConsistency(c => c
        .WithCommands("ACID")
        .WithQueries("EVENTUAL"));

    options.ConfigureNetwork(n => n
        .AddRequiredEgress("localhost:6379"));

    options.ConfigureSecurity(s => s
        .WithAuthenticationType("jwt")
        .AddRequiredScope("orders.read")
        .AddRequiredScope("orders.write")
        .AddDataClassification("internal"));

    options.License = "MIT";
});

// Sample request/response types
[SpasCommand("CreateOrder", "1.0", Produces = new[] { typeof(OrderCreatedEvent) })]
public record CreateOrderRequest(string CustomerId, decimal Total);

[SpasQuery("GetOrder", "1.0")]
public record GetOrderResponse(Guid OrderId, string Status, decimal Total);

// Sample event - auto-discovered from assembly scan
[SpasEvent("OrderCreated", "1.0", EventType = "com.sample-service.order.created")]
public record OrderCreatedEvent(Guid OrderId, string CustomerId, decimal Total, DateTime CreatedAt);
