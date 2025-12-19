package io.spas.sdk.core.util;

/**
 * Utility class for converting strings between different case formats.
 * Primarily used for converting PascalCase/camelCase to kebab-case
 * as required by SPAS metadata schema.
 */
public final class KebabCaseConverter {

    private KebabCaseConverter() {
        // Prevent instantiation
    }

    /**
     * Converts a PascalCase or camelCase string to kebab-case.
     * <p>
     * Examples:
     * <ul>
     *   <li>"OrderCreated" → "order-created"</li>
     *   <li>"CreateOrder" → "create-order"</li>
     *   <li>"HTTPRequest" → "http-request"</li>
     *   <li>"IOError" → "io-error"</li>
     * </ul>
     *
     * @param input the PascalCase or camelCase string
     * @return the kebab-case string, or null if input is null
     */
    public static String toKebabCase(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        StringBuilder result = new StringBuilder();
        boolean previousWasUpperCase = false;

        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            
            if (Character.isUpperCase(c)) {
                // Add hyphen before uppercase letter if:
                // 1. Not at the start
                // 2. Previous char was lowercase OR next char is lowercase (handles acronyms like "HTTPRequest")
                if (i > 0 && (!previousWasUpperCase || (i < input.length() - 1 && Character.isLowerCase(input.charAt(i + 1))))) {
                    result.append('-');
                }
                result.append(Character.toLowerCase(c));
                previousWasUpperCase = true;
            } else {
                result.append(c);
                previousWasUpperCase = false;
            }
        }

        return result.toString();
    }

    /**
     * Converts a kebab-case string to PascalCase.
     * <p>
     * Examples:
     * <ul>
     *   <li>"order-created" → "OrderCreated"</li>
     *   <li>"create-order" → "CreateOrder"</li>
     * </ul>
     *
     * @param input the kebab-case string
     * @return the PascalCase string, or null if input is null
     */
    public static String toPascalCase(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        StringBuilder result = new StringBuilder();
        boolean capitalizeNext = true;

        for (char c : input.toCharArray()) {
            if (c == '-') {
                capitalizeNext = true;
            } else {
                result.append(capitalizeNext ? Character.toUpperCase(c) : c);
                capitalizeNext = false;
            }
        }

        return result.toString();
    }
}
