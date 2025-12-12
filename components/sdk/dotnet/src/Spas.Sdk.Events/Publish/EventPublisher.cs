using System.Net.Http.Json;
using System.Text.Json;
using Spas.Sdk.Core.Context;
using Spas.Sdk.Core.Tracing;

namespace Spas.Sdk.Events.Publish;

/// <summary>
/// Publishes events to the SPAS sidecar via HTTP.
/// The SDK sends only the payload and metadata via headers.
/// The sidecar wraps the payload in CloudEvents 1.0 format and publishes to the event bus.
/// </summary>
/// <remarks>
/// Headers sent to sidecar (used by sidecar to construct CloudEvents envelope):
/// - traceparent: W3C Trace Context (format: 00-{trace-id}-{span-id}-{flags})
/// - x-service-name: Source service name (maps to CloudEvents 'source')
/// - x-event-type: Event type (maps to CloudEvents 'type' - typically reverse-DNS format)
/// - x-correlation-id: Correlation ID for event chain correlation
/// - x-user-id: Optional user identity claim
/// - x-tenant-id: Optional tenant identity claim
/// 
/// Body: Raw JSON payload (sidecar wraps this as CloudEvents 'data' field)
/// </remarks>
public class EventPublisher
{
    private readonly HttpClient _httpClient;
    private readonly string _serviceName;
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
    /// </summary>
    /// <param name="topic">The topic/subject to publish to (message bus routing).</param>
    /// <param name="eventType">The CloudEvents type value (typically reverse-DNS format, e.g., com.example.order.created).</param>
    /// <param name="payload">The event payload (business data) to publish.</param>
    /// <returns>A task representing the asynchronous publish operation.</returns>
    /// <exception cref="ArgumentNullException">Thrown when topic, eventType, or payload is null.</exception>
    /// <exception cref="HttpRequestException">Thrown when the sidecar returns an error response.</exception>
    public async Task PublishAsync(string topic, string eventType, object payload)
    {
        if (topic == null)
        {
            throw new ArgumentNullException(nameof(topic));
        }

        if (eventType == null)
        {
            throw new ArgumentNullException(nameof(eventType));
        }

        if (payload == null)
        {
            throw new ArgumentNullException(nameof(payload));
        }

        // Construct sidecar publish endpoint: /publish/{topic}
        var publishUrl = $"/publish/{topic}";

        // Create HTTP request with trace and context headers
        var request = new HttpRequestMessage(HttpMethod.Post, publishUrl);
        
        // W3C Trace Context - sidecar includes in CloudEvents 'traceparent' extension
        request.Headers.Add("traceparent", SpasTrace.TraceParent);
        
        // Service name - sidecar uses for CloudEvents 'source' field
        request.Headers.Add("x-service-name", _serviceName);
        
        // Event type - sidecar uses for CloudEvents 'type' field
        request.Headers.Add("x-event-type", eventType);
        
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
}

