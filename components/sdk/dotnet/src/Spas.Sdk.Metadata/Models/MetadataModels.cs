namespace Spas.Sdk.Metadata.Models;

/// <summary>
/// Service identity metadata.
/// </summary>
public class ServiceIdentity
{
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Owner { get; set; }
    public string? Repository { get; set; }
}

/// <summary>
/// Service contracts metadata.
/// </summary>
public class ServiceContracts
{
    public List<ContractDefinition> Commands { get; set; } = new();
    public List<ContractDefinition> Queries { get; set; } = new();
    public List<EventDefinition> Events { get; set; } = new();
}

/// <summary>
/// Contract definition for commands and queries.
/// </summary>
public class ContractDefinition
{
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Schema { get; set; } = string.Empty;
}

/// <summary>
/// Event definition.
/// </summary>
public class EventDefinition
{
    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Schema { get; set; } = string.Empty;
}

/// <summary>
/// Security metadata.
/// </summary>
public class SecurityMetadata
{
    public string? Authentication { get; set; }
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
