namespace Spas.Sdk.Core.Abstractions;

/// <summary>
/// Abstraction for time access to support testing and deterministic behavior.
/// </summary>
public interface ISpasClock
{
    /// <summary>
    /// Gets the current UTC time.
    /// </summary>
    DateTimeOffset UtcNow { get; }
}

/// <summary>
/// System clock implementation using DateTimeOffset.UtcNow.
/// </summary>
public sealed class SystemClock : ISpasClock
{
    /// <inheritdoc />
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
