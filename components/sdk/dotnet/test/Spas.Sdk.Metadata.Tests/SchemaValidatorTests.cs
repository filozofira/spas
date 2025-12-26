using Xunit;
using Spas.Sdk.Metadata.Validation;
using System.Text.Json;

namespace Spas.Sdk.Metadata.Tests;

public class SchemaValidatorTests
{
    [Fact]
    public void Validate_WithValidJson_ReturnsSuccess()
    {
        // Arrange
        var validator = new SchemaValidator();
        var json = JsonSerializer.Serialize(new
        {
            schemaVersion = "design-time-metadata-v1",
            id = "test-service",
            name = "Test Service",
            version = "1.0.0",
            boundedContext = "Testing"
        });

        // Act
        var result = validator.Validate(json);

        // Assert
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void Validate_WithInvalidJson_ReturnsErrors()
    {
        // Arrange
        var validator = new SchemaValidator();
        var json = "{ invalid json }";

        // Act
        var result = validator.Validate(json);

        // Assert
        Assert.False(result.IsValid);
        Assert.NotEmpty(result.Errors);
    }

    [Fact]
    public void Validate_WithMissingRequiredFields_ReturnsErrors()
    {
        // Arrange
        var validator = new SchemaValidator();
        var json = JsonSerializer.Serialize(new { });

        // Act
        var result = validator.Validate(json);

        // Assert
        Assert.False(result.IsValid);
        Assert.NotEmpty(result.Errors);
    }

    [Fact]
    public void ValidateAgainstSchema_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var validator = new SchemaValidator();
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""name"": { ""type"": ""string"" }
            },
            ""required"": [""name""]
        }";
        var data = JsonSerializer.Serialize(new { name = "test" });

        // Act
        var result = validator.ValidateAgainstSchema(data, schema);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidateAgainstSchema_WithInvalidData_ReturnsErrors()
    {
        // Arrange
        var validator = new SchemaValidator();
        var schema = @"{
            ""type"": ""object"",
            ""properties"": {
                ""name"": { ""type"": ""string"" }
            },
            ""required"": [""name""]
        }";
        var data = JsonSerializer.Serialize(new { age = 25 });

        // Act
        var result = validator.ValidateAgainstSchema(data, schema);

        // Assert
        Assert.False(result.IsValid);
        Assert.NotEmpty(result.Errors);
    }
}
