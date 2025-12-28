using System.Net;
using System.Reflection;
using System.Text.Json;
using Spas.Sdk.Core.Context;
using Spas.Sdk.Core.Tracing;
using Spas.Sdk.Events.Publish;
using Spas.Sdk.Metadata.Attributes;
using Xunit;

namespace Spas.Sdk.Events.Tests;

/// <summary>
/// Test event class for verifying generic PublishAsync behavior.
/// </summary>
[SpasEvent("OrderCreated", "1.0")]
internal class TestOrderCreatedEvent
{
}

/// <summary>
/// Test event class WITHOUT SpasEvent attribute - used to test validation.
/// </summary>
internal class TestEventWithoutAttribute
{
}

/// <summary>
/// Tests for EventPublisher - verifies payload publishing and header propagation to sidecar.
/// </summary>
public class EventPublisherTests
{
    private const string TestServiceName = "test-service";

    [Fact]
    public void Constructor_WithNullHttpClient_ThrowsArgumentNullException()
    {
        var exception = Assert.Throws<ArgumentNullException>(() => new EventPublisher(null!, TestServiceName));
        Assert.Equal("httpClient", exception.ParamName);
    }

    [Fact]
    public void Constructor_WithNullServiceName_ThrowsArgumentNullException()
    {
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };

        var exception = Assert.Throws<ArgumentNullException>(() => new EventPublisher(httpClient, null!));
        Assert.Equal("serviceName", exception.ParamName);
    }

    [Fact]
    public void Constructor_WithEmptyServiceName_ThrowsArgumentNullException()
    {
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };

        var exception = Assert.Throws<ArgumentNullException>(() => new EventPublisher(httpClient, ""));
        Assert.Equal("serviceName", exception.ParamName);
    }

    [Fact]
    public async Task PublishAsync_SendsTraceparentHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act
        await publisher.PublishAsync<TestOrderCreatedEvent>(testPayload);

        // Assert
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.True(request!.Headers.Contains("traceparent"));
        var traceparent = request.Headers.GetValues("traceparent").First();
        Assert.StartsWith("00-", traceparent); // W3C Trace Context format
    }

    [Fact]
    public async Task PublishAsync_SendsServiceNameHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act
        await publisher.PublishAsync<TestOrderCreatedEvent>(testPayload);

        // Assert
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.True(request!.Headers.Contains("x-service-name"));
        var serviceName = request.Headers.GetValues("x-service-name").First();
        Assert.Equal(TestServiceName, serviceName);
    }

    [Fact]
    public async Task PublishAsync_SendsCorrelationIdHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Set correlation context
        var testCorrelationId = Guid.NewGuid().ToString();
        SpasContext.CorrelationId = testCorrelationId;

        try
        {
            // Act
            await publisher.PublishAsync<TestOrderCreatedEvent>(testPayload);

            // Assert
            var request = mockHandler.LastRequest;
            Assert.NotNull(request);
            Assert.True(request!.Headers.Contains("x-correlation-id"));
            var correlationId = request.Headers.GetValues("x-correlation-id").First();
            Assert.Equal(testCorrelationId, correlationId);
        }
        finally
        {
            SpasContext.CorrelationId = null;
        }
    }

    [Fact]
    public async Task PublishAsync_WithUserIdInContext_SendsUserIdHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Set user context
        var testUserId = "user-456";
        SpasContext.UserId = testUserId;

        try
        {
            // Act
            await publisher.PublishAsync<TestOrderCreatedEvent>(testPayload);

            // Assert
            var request = mockHandler.LastRequest;
            Assert.NotNull(request);
            Assert.True(request!.Headers.Contains("x-user-id"));
            var userId = request.Headers.GetValues("x-user-id").First();
            Assert.Equal(testUserId, userId);
        }
        finally
        {
            SpasContext.UserId = null;
        }
    }

    [Fact]
    public async Task PublishAsync_WithTenantIdInContext_SendsTenantIdHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Set tenant context
        var testTenantId = "tenant-789";
        SpasContext.TenantId = testTenantId;

        try
        {
            // Act
            await publisher.PublishAsync<TestOrderCreatedEvent>(testPayload);

            // Assert
            var request = mockHandler.LastRequest;
            Assert.NotNull(request);
            Assert.True(request!.Headers.Contains("x-tenant-id"));
            var tenantId = request.Headers.GetValues("x-tenant-id").First();
            Assert.Equal(testTenantId, tenantId);
        }
        finally
        {
            SpasContext.TenantId = null;
        }
    }

    [Fact]
    public async Task PublishAsync_SerializesPayloadAsJson()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123", amount = 99.50 };

        // Act
        await publisher.PublishAsync<TestOrderCreatedEvent>(testPayload);

        // Assert
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.NotNull(request!.Content);
        var json = await request.Content!.ReadAsStringAsync();
        var deserializedPayload = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
        Assert.NotNull(deserializedPayload);
        Assert.Equal("123", deserializedPayload!["orderId"].GetString());
        Assert.Equal(99.50, deserializedPayload["amount"].GetDouble());
    }

    [Fact]
    public async Task PublishAsync_SendsToCorrectEndpoint()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act
        await publisher.PublishAsync<TestOrderCreatedEvent>(testPayload);

        // Assert
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.Equal("/publish", request!.RequestUri!.AbsolutePath);
        Assert.Equal(HttpMethod.Post, request.Method);
    }

    [Fact]
    public async Task PublishAsync_WithNullPayload_ThrowsArgumentNullException()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentNullException>(
            () => publisher.PublishAsync<TestOrderCreatedEvent>(null!));
        Assert.Equal("payload", exception.ParamName);
    }

    [Fact]
    public async Task PublishAsync_WhenSidecarReturnsError_ThrowsHttpRequestException()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.InternalServerError);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act & Assert
        await Assert.ThrowsAsync<HttpRequestException>(
            () => publisher.PublishAsync<TestOrderCreatedEvent>(testPayload));
    }

    // Test removed: PublishAsync(string, object) is now internal and cannot be tested from external code
    // Generic overload validates eventName via [SpasEvent] attribute instead

    // Test removed: PublishAsync(string, object) is now internal and cannot be called from external code
    // Generic overload uses [SpasEvent] attribute for event name instead of accepting string parameter

    [Fact]
    public async Task PublishAsync_DoesNotSendEventTypeHeader()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123" };

        // Act
        await publisher.PublishAsync<TestOrderCreatedEvent>(testPayload);

        // Assert - x-event-type header should NOT be present (legacy header removed)
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.False(request!.Headers.Contains("x-event-type"));
    }

    [Fact]
    public async Task PublishAsyncGeneric_SendsKebabCaseEventName()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, TestServiceName);
        var testPayload = new { orderId = "123", amount = 99.50 };

        // Act - use the generic method with a decorated event type
        await publisher.PublishAsync<TestOrderCreatedEvent>(testPayload);

        // Assert - should send x-event-name with kebab-case value derived from attribute
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.True(request!.Headers.Contains("x-event-name"));
        var eventName = request.Headers.GetValues("x-event-name").First();
        Assert.Equal("order-created", eventName); // PascalCase "OrderCreated" -> kebab "order-created"
    }
}

/// <summary>
/// Mock HTTP message handler for testing HTTP requests without actual network calls.
/// Note: HttpClient owns and disposes the HttpResponseMessage, so we don't track responses here.
/// </summary>
internal class MockHttpMessageHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _statusCode;

    public HttpRequestMessage? LastRequest { get; private set; }

    public MockHttpMessageHandler(HttpStatusCode statusCode)
    {
        _statusCode = statusCode;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        LastRequest = request;
        // HttpClient will own and dispose this response - we must not track or dispose it ourselves
        return Task.FromResult(new HttpResponseMessage(_statusCode));
    }
}

// T019: Test verifying PublishAsync(string, object) is internal (US4)
public class EventPublisherAccessibilityTests
{
    [Fact]
    public void PublishAsync_StringOverload_IsInternal()
    {
        // Arrange - use reflection to check method visibility
        var publisherType = typeof(EventPublisher);
        var method = publisherType.GetMethod(
            "PublishAsync",
            BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic,
            null,
            new[] { typeof(string), typeof(object) },
            null);

        // Assert - method exists and is internal
        Assert.NotNull(method);
        Assert.True(method!.IsAssembly, "PublishAsync(string, object) should be internal");
        Assert.False(method.IsPublic, "PublishAsync(string, object) should not be public");
    }

    // T020: Test verifying PublishAsync<TEvent> remains public and functional (US4)
    [Fact]
    public async Task PublishAsync_GenericOverload_IsPublicAndFunctional()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, "test-service");
        var testPayload = new { orderId = "123", total = 99.99m };

        // Act - call generic method (should be public and accessible)
        await publisher.PublishAsync<TestOrderCreatedEvent>(testPayload);

        // Assert - verify it's public via reflection
        var publisherType = typeof(EventPublisher);
        var method = publisherType.GetMethod(
            "PublishAsync",
            BindingFlags.Instance | BindingFlags.Public,
            null,
            CallingConventions.Any,
            new[] { typeof(object) },
            null);

        Assert.NotNull(method);
        Assert.True(method!.IsPublic, "PublishAsync<TEvent> should be public");
        Assert.True(method.IsGenericMethodDefinition, "PublishAsync<TEvent> should be generic");

        // Verify request was sent correctly
        var request = mockHandler.LastRequest;
        Assert.NotNull(request);
        Assert.True(request!.Headers.Contains("x-event-name"));
        var eventName = request.Headers.GetValues("x-event-name").First();
        Assert.Equal("order-created", eventName); // Converted from "OrderCreated" to kebab-case
    }

    // T021: Test for InvalidOperationException when event type lacks SpasEvent attribute (US4)
    [Fact]
    public async Task PublishAsync_GenericWithoutAttribute_ThrowsInvalidOperationException()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, "test-service");
        var testPayload = new { someData = "test" };

        // Act & Assert - should throw clear exception
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await publisher.PublishAsync<TestEventWithoutAttribute>(testPayload));

        Assert.Contains("TestEventWithoutAttribute", exception.Message);
        Assert.Contains("[SpasEvent]", exception.Message);
        Assert.Contains("must be decorated with", exception.Message);
    }

    // Additional test: Verify generic method can't accidentally call string overload from outside
    [Fact]
    public void PublishAsync_StringOverload_NotAccessibleFromExternalCode()
    {
        // Arrange
        var mockHandler = new MockHttpMessageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(mockHandler) { BaseAddress = new Uri("http://localhost:8080") };
        var publisher = new EventPublisher(httpClient, "test-service");

        // Act - try to get the string overload as a public method
        var publisherType = typeof(EventPublisher);
        var publicMethod = publisherType.GetMethod(
            "PublishAsync",
            BindingFlags.Instance | BindingFlags.Public,
            null,
            new[] { typeof(string), typeof(object) },
            null);

        // Assert - should not be accessible as public method
        Assert.Null(publicMethod);
    }
}



