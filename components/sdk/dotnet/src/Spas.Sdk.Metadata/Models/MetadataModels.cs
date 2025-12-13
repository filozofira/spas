namespace Spas.Sdk.Metadata.Models;

/// <summary>
/// Service identity metadata.
/// </summary>
public class ServiceIdentity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string BoundedContext { get; set; } = string.Empty;
    public List<string> Capabilities { get; set; } = new();
}

/// <summary>
/// Service contracts metadata.
/// </summary>
public class ServiceContracts
{
    public List<EndpointContract> Endpoints { get; set; } = new();
    public List<EventContract> Events { get; set; } = new();
}

/// <summary>
/// Contract definition for commands and queries.
/// </summary>
public class EndpointContract
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Command | Query
    public string Protocol { get; set; } = string.Empty; // Http | gRPC
    public string MethodPath { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string SchemaRef { get; set; } = string.Empty;
    public string? Description { get; set; }
}

/// <summary>
/// Event definition.
/// </summary>
public class EventContract
{
    public string Type { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string SchemaRef { get; set; } = string.Empty;
}

/// <summary>
/// Security metadata.
/// </summary>
public class SecurityMetadata
{
    public AuthenticationMetadata? Authentication { get; set; }
    public List<string> DataClassification { get; set; } = new();
}

public class AuthenticationMetadata
{
    public string Type { get; set; } = string.Empty; // e.g., jwt
    public List<string> RequiredScopes { get; set; } = new();
}

/// <summary>
/// Health check metadata.
/// </summary>
public class HealthMetadata
{
    public string HealthEndpoint { get; set; } = "/health";
    public int TimeoutSeconds { get; set; } = 30;
}

public class ConsistencyMetadata
{
    public string Commands { get; set; } = "ACID";
    public string Queries { get; set; } = "EVENTUAL"; // STRONG | EVENTUAL
}

public class NetworkMetadata
{
    public List<string> RequiredEgress { get; set; } = new();
}
