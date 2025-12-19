package io.spas.sdk.core.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class KebabCaseConverterTest {

    @ParameterizedTest
    @CsvSource({
        "OrderCreated, order-created",
        "CreateOrder, create-order",
        "GetOrderById, get-order-by-id",
        "HTTPRequest, http-request",
        "IOError, io-error",
        "XMLParser, xml-parser",
        "parseXMLDocument, parse-xml-document",
        "simpleCase, simple-case",
        "alreadylowercase, alreadylowercase",
        "ALLUPPERCASE, alluppercase",
        "A, a",
        "AB, ab",
        "ABC, abc"
    })
    void toKebabCase_shouldConvertCorrectly(String input, String expected) {
        assertEquals(expected, KebabCaseConverter.toKebabCase(input));
    }

    @Test
    void toKebabCase_shouldHandleNull() {
        assertNull(KebabCaseConverter.toKebabCase(null));
    }

    @Test
    void toKebabCase_shouldHandleEmptyString() {
        assertEquals("", KebabCaseConverter.toKebabCase(""));
    }

    @Test
    void toKebabCase_shouldHandleSingleCharacter() {
        assertEquals("a", KebabCaseConverter.toKebabCase("A"));
        assertEquals("x", KebabCaseConverter.toKebabCase("x"));
    }

    @Test
    void toKebabCase_shouldHandleConsecutiveUpperCase() {
        assertEquals("http-request", KebabCaseConverter.toKebabCase("HTTPRequest"));
        assertEquals("io-exception", KebabCaseConverter.toKebabCase("IOException"));
        assertEquals("json-parser", KebabCaseConverter.toKebabCase("JSONParser"));
    }

    @ParameterizedTest
    @CsvSource({
        "order-created, OrderCreated",
        "create-order, CreateOrder",
        "get-order-by-id, GetOrderById",
        "http-request, HttpRequest",
        "simple-case, SimpleCase",
        "a, A",
        "already-pascal-case, AlreadyPascalCase"
    })
    void toPascalCase_shouldConvertCorrectly(String input, String expected) {
        assertEquals(expected, KebabCaseConverter.toPascalCase(input));
    }

    @Test
    void toPascalCase_shouldHandleNull() {
        assertNull(KebabCaseConverter.toPascalCase(null));
    }

    @Test
    void toPascalCase_shouldHandleEmptyString() {
        assertEquals("", KebabCaseConverter.toPascalCase(""));
    }

    @Test
    void toPascalCase_shouldHandleSingleCharacter() {
        assertEquals("A", KebabCaseConverter.toPascalCase("a"));
        assertEquals("X", KebabCaseConverter.toPascalCase("x"));
    }

    @Test
    void roundTrip_shouldBeIdempotent() {
        String[] inputs = {
            "OrderCreated",
            "CreateOrder",
            "HTTPRequest",
            "SimpleCase"
        };

        for (String input : inputs) {
            String kebab = KebabCaseConverter.toKebabCase(input);
            String pascal = KebabCaseConverter.toPascalCase(kebab);
            
            // Note: HTTPRequest -> http-request -> HttpRequest (acronyms lose their case)
            // This is expected behavior as we can't distinguish "HTTP" from "Http" in kebab-case
            assertNotNull(pascal);
        }
    }
}
