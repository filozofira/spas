using Spas.Sdk.Metadata.Attributes;
using Spas.Sdk.Metadata.Builders;
using Spas.Sdk.Metadata.Composition;
using Spas.Sdk.Metadata.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Register SPAS metadata services with auto-discovery
builder.Services.AddSpasMetadata(options =>
{
    options.AssembliesToScan.Add(typeof(Program).Assembly);
    options.AutoGenerateSchemaReferences = true;
});

var app = builder.Build();

// Define service identity (still manual - service-level metadata)
var identity = new ServiceIdentityBuilder()
    .WithName("sample-service")
    .WithVersion("1.0.0")
    .WithDescription("Sample SPAS service demonstrating SDK usage")
    .WithOwner("platform-team")
    .Build();

// Define endpoints with SPAS attributes - contracts auto-discovered!
app.MapPost("/commands/create-order",
    (CreateOrderRequest request) => 
    {
        return Results.Ok(new { orderId = Guid.NewGuid(), status = "created" });
    })
    .WithMetadata(new SpasCommandAttribute("CreateOrder", "1.0") 
    { 
        Schema = "schemas/create-order.schema.json" 
    });

app.MapGet("/queries/get-order/{id}",
    (Guid id) => 
    {
        return Results.Ok(new { orderId = id, status = "completed", total = 99.99 });
    })
    .WithMetadata(new SpasQueryAttribute("GetOrder", "1.0") 
    { 
        Schema = "schemas/get-order.schema.json" 
    });

// Discover contracts from attributes
var contracts = app.DiscoverSpasMetadata();

var security = new SecurityBuilder()
    .WithAuthentication("jwt")
    .AddRequiredScope("orders.read")
    .AddRequiredScope("orders.write")
    .Build();

var health = new HealthBuilder()
    .WithHealthEndpoint("/health")
    .WithTimeout(30)
    .Build();

// Compose and write spas.json using discovered contracts
var composer = new SpasComposer();
var metadataPath = Path.Combine(AppContext.BaseDirectory, "spas.json");
composer.ComposeToFile(metadataPath, identity, contracts, security, health);

app.MapGet("/", () => "Hello from SPAS Sample Service!");

app.MapGet("/health", () => new { status = "healthy", timestamp = DateTime.UtcNow });

app.Run();

// Sample request types
public record CreateOrderRequest(string CustomerId, decimal Total);

// Sample event - auto-discovered from assembly scan
[SpasEvent("OrderCreated", "1.0", Schema = "schemas/order-created.schema.json")]
public record OrderCreatedEvent(Guid OrderId, string CustomerId, decimal Total, DateTime CreatedAt);
