using Spas.Sdk.Metadata.Attributes;

namespace Spas.Sdk.Metadata.Tests;

public class ToKebabCaseTests
{
    // Test ToKebabCase indirectly through attribute constructors
    private static string ToKebabCase(string value)
    {
        var attr = new SpasCommandAttribute(value, "1.0");
        // Extract the name part from the generated path
        var schema = attr.Schema!;
        var fileName = Path.GetFileNameWithoutExtension(schema);
        return fileName.Replace(".schema", "");
    }

    [Theory]
    [InlineData("CreateOrder", "create-order")]
    [InlineData("GetOrder", "get-order")]
    [InlineData("OrderCreated", "order-created")]
    [InlineData("TestCommand", "test-command")]
    [InlineData("TestQuery", "test-query")]
    public void ToKebabCase_WithPascalCase_ConvertsToKebabCase(string input, string expected)
    {
        // Act
        var result = ToKebabCase(input);

        // Assert
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("A", "a")]
    [InlineData("X", "x")]
    public void ToKebabCase_WithSingleLetter_ConvertsToLowercase(string input, string expected)
    {
        // Act
        var result = ToKebabCase(input);

        // Assert
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("API", "a-p-i")]
    [InlineData("HTTP", "h-t-t-p")]
    [InlineData("XMLParser", "x-m-l-parser")]
    public void ToKebabCase_WithAcronyms_InsertsHyphens(string input, string expected)
    {
        // Act
        var result = ToKebabCase(input);

        // Assert
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("Order2Created", "order2-created")]
    [InlineData("V1Command", "v1-command")]
    [InlineData("GetUser123", "get-user123")]
    public void ToKebabCase_WithNumbers_KeepsNumbersInPlace(string input, string expected)
    {
        // Act
        var result = ToKebabCase(input);

        // Assert
        Assert.Equal(expected, result);
    }

    [Fact]
    public void ToKebabCase_WithEmptyString_ReturnsEmptyString()
    {
        // Act
        var result = ToKebabCase("");

        // Assert
        Assert.Equal("", result);
    }

    [Fact]
    public void ToKebabCase_WithAlreadyKebabCase_KeepsAsIs()
    {
        // Arrange
        var input = "already-kebab-case";

        // Act
        var result = ToKebabCase(input);

        // Assert
        Assert.Equal("already-kebab-case", result);
    }

    [Theory]
    [InlineData("lowercase", "lowercase")]
    [InlineData("simple", "simple")]
    public void ToKebabCase_WithAllLowercase_KeepsAsIs(string input, string expected)
    {
        // Act
        var result = ToKebabCase(input);

        // Assert
        Assert.Equal(expected, result);
    }
}
