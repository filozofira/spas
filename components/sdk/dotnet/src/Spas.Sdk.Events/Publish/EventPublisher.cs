using System.Diagnostics;
using System.Net.Http.Json;
using System.Reflection;
using System.Text.Json;
using Spas.Sdk.Core.Context;
using Spas.Sdk.Core.Tracing;
using Spas.Sdk.Metadata.Attributes;

namespace Spas.Sdk.Events.Publish;

/// <summary>
/// Publishes events to the SPAS sidecar via HTTP.
/// The SDK sends only the payload and metadata via headers.
/// The sidecar wraps the payload in CloudEvents 1.0 format and routes to the appropriate topic based on event name.
/// </summary>
/// <remarks>
/// Headers sent to sidecar (used by sidecar to construct CloudEvents envelope and route events):
/// - traceparent: W3C Trace Context (format: 00-{trace-id}-{span-id}-{flags})
/// - x-service-name: Source service name (maps to CloudEvents 'source')
/// - x-event-name: Short kebab-case event name (sidecar constructs full CloudEvents 'type' as com.{service-name}.{event-name})
/// - x-correlation-id: Correlation ID for event chain correlation
/// - x-user-id: Optional user identity claim
/// - x-tenant-id: Optional tenant identity claim
/// 
/// Body: Raw JSON payload (sidecar wraps this as CloudEvents 'data' field)
/// 
/// Topic routing is configured in the sidecar, not the service.
/// </remarks>
public class EventPublisher
{
    private readonly HttpClient _httpClient;
    private readonly string _serviceName;
    private static readonly ActivitySource ActivitySource = new("Spas.Sdk.Events", "1.0.0");
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    /// <summary>
    /// Initializes a new instance of the <see cref="EventPublisher"/> class.
    /// </summary>
    /// <param name="httpClient">The HTTP client configured to communicate with the sidecar.</param>
    /// <param name="serviceName">The name of this service (used in x-service-name header).</param>
    public EventPublisher(HttpClient httpClient, string serviceName)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _serviceName = !string.IsNullOrEmpty(serviceName)
            ? serviceName
            : throw new ArgumentNullException(nameof(serviceName));
    }

    /// <summary>
    /// Publishes an event payload to the sidecar for wrapping and forwarding to the event bus.
    /// The sidecar constructs the full CloudEvents type from service name and event name.
    /// </summary>
    /// <param name="eventName">Short kebab-case event name (e.g., "order-created"). Sidecar constructs full type as com.{service-name}.{event-name}.</param>
    /// <param name="payload">The event payload (business data) to publish.</param>
    /// <returns>A task representing the asynchronous publish operation.</returns>
    /// <exception cref="ArgumentNullException">Thrown when eventName or payload is null.</exception>
    /// <exception cref="HttpRequestException">Thrown when the sidecar returns an error response.</exception>
    public async Task PublishAsync(string eventName, object payload)
    {
        if (eventName == null)
        {
            throw new ArgumentNullException(nameof(eventName));
        }

        if (payload == null)
        {
            throw new ArgumentNullException(nameof(payload));
        }

        // Create Activity/span for distributed tracing with cloudevents.type tag
        using var activity = ActivitySource.StartActivity("publish", ActivityKind.Producer);
        var cloudEventsType = $"com.{_serviceName}.{eventName}";
        activity?.SetTag("cloudevents.type", cloudEventsType);
        activity?.SetTag("messaging.destination", "/publish");

        // Construct sidecar publish endpoint
        var publishUrl = "/publish";

        // Create HTTP request with trace and context headers
        var request = new HttpRequestMessage(HttpMethod.Post, publishUrl);

        // W3C Trace Context - sidecar includes in CloudEvents 'traceparent' extension
        request.Headers.Add("traceparent", SpasTrace.TraceParent);

        // Service name - sidecar uses for CloudEvents 'source' field
        request.Headers.Add("x-service-name", _serviceName);

        // Event name - sidecar constructs full CloudEvents 'type' field as com.{service-name}.{event-name}
        request.Headers.Add("x-event-name", eventName);

        // Correlation ID - sidecar includes in CloudEvents 'correlationid' extension
        var correlationId = SpasContext.CorrelationId ?? Guid.NewGuid().ToString();
        request.Headers.Add("x-correlation-id", correlationId);

        // Optional identity claims - sidecar can include in CloudEvents extensions or data
        if (!string.IsNullOrEmpty(SpasContext.UserId))
        {
            request.Headers.Add("x-user-id", SpasContext.UserId);
        }

        if (!string.IsNullOrEmpty(SpasContext.TenantId))
        {
            request.Headers.Add("x-tenant-id", SpasContext.TenantId);
        }

        // Body contains ONLY the raw payload - sidecar wraps in CloudEvents 'data' field
        request.Content = JsonContent.Create(payload, options: JsonOptions);

        // Send to sidecar
        var response = await _httpClient.SendAsync(request).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();
    }

    /// <summary>
    /// Publishes an event payload to the sidecar, deriving the event name from the <see cref="SpasEventAttribute"/> on <typeparamref name="TEvent"/>.
    /// The sidecar constructs the full CloudEvents type from service name and event name.
    /// </summary>
    /// <typeparam name="TEvent">The event type decorated with <see cref="SpasEventAttribute"/>.</typeparam>
    /// <param name="payload">The event payload (business data) to publish.</param>
    /// <returns>A task representing the asynchronous publish operation.</returns>
    /// <exception cref="ArgumentNullException">Thrown when payload is null.</exception>
    /// <exception cref="InvalidOperationException">Thrown when <typeparamref name="TEvent"/> is not decorated with <see cref="SpasEventAttribute"/>.</exception>
    /// <exception cref="HttpRequestException">Thrown when the sidecar returns an error response.</exception>
    public async Task PublishAsync<TEvent>(object payload) where TEvent : class
    {
        if (payload == null)
        {
            throw new ArgumentNullException(nameof(payload));
        }

        // Extract SpasEventAttribute from TEvent
        var eventAttribute = typeof(TEvent).GetCustomAttribute<SpasEventAttribute>();
        if (eventAttribute == null)
        {
            throw new InvalidOperationException(
                $"Type {typeof(TEvent).Name} must be decorated with [SpasEvent] attribute to use generic PublishAsync.");
        }

        // Derive event name: convert PascalCase attribute Name to kebab-case
        // Example: "OrderCreated" -> "order-created"
        var eventName = ConvertToKebabCase(eventAttribute.Name);

        // Delegate to the existing PublishAsync method (sidecar constructs full type)
        await PublishAsync(eventName, payload);
    }

    /// <summary>
    /// Converts PascalCase to kebab-case (e.g., "OrderCreated" -> "order-created").
    /// </summary>
    private static string ConvertToKebabCase(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return value;
        }

        // Insert hyphen before uppercase letters (except first), then lowercase
        var result = System.Text.RegularExpressions.Regex.Replace(
            value,
            "(?<!^)([A-Z])",
            "-$1");
        return result.ToLowerInvariant();
    }
}

