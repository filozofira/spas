/**
 * JsonataValidator - Validates JSONata transformation expressions
 */

import * as fs from "fs";
import * as path from "path";
import jsonata from "jsonata";

/**
 * Result from syntax validation
 */
export interface SyntaxValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Result from file validation
 */
export interface FileValidationResult {
  isValid: boolean;
  path: string;
  errors: string[];
}

/**
 * Service for validating JSONata transformation files
 */
export class JsonataValidator {
  /**
   * Validate JSONata expression syntax
   */
  validateSyntax(expression: string): SyntaxValidationResult {
    try {
      // Attempt to compile the expression
      jsonata(expression);
      return {
        isValid: true,
        errors: [],
      };
    } catch (error) {
      const jsonataError = error as Error;
      return {
        isValid: false,
        errors: [jsonataError.message],
      };
    }
  }

  /**
   * Validate a .jsonata file exists and has valid syntax
   */
  validateFile(
    workspacePath: string,
    relativePath: string,
  ): FileValidationResult {
    const fullPath = path.join(workspacePath, relativePath);
    const errors: string[] = [];

    // Check file exists
    if (!fs.existsSync(fullPath)) {
      return {
        isValid: false,
        path: relativePath,
        errors: [`File not found: ${relativePath}`],
      };
    }

    // Check extension
    if (!this.isValidFilename(relativePath)) {
      errors.push(`File must have .jsonata extension: ${relativePath}`);
    }

    // Read and validate syntax
    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      const syntaxResult = this.validateSyntax(content);

      if (!syntaxResult.isValid) {
        errors.push(...syntaxResult.errors);
      }
    } catch (error) {
      errors.push(`Failed to read file: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      path: relativePath,
      errors,
    };
  }

  /**
   * Validate multiple transformation files
   */
  validateFiles(
    workspacePath: string,
    relativePaths: string[],
  ): { valid: FileValidationResult[]; invalid: FileValidationResult[] } {
    const valid: FileValidationResult[] = [];
    const invalid: FileValidationResult[] = [];

    for (const relativePath of relativePaths) {
      const result = this.validateFile(workspacePath, relativePath);
      if (result.isValid) {
        valid.push(result);
      } else {
        invalid.push(result);
      }
    }

    return { valid, invalid };
  }

  /**
   * Check if filename has valid .jsonata extension
   */
  isValidFilename(filename: string): boolean {
    return filename.endsWith(".jsonata");
  }

  /**
   * Parse transformation path to extract metadata
   */
  parseTransformPath(transformPath: string): {
    serviceName: string;
    direction: "inbound" | "outbound";
    eventType: string;
  } | null {
    // Expected format: transformations/<service>/<direction>-<event>.jsonata
    const match = transformPath.match(
      /transformations\/([a-z0-9-]+)\/(inbound|outbound)-([a-z0-9-]+)\.jsonata$/,
    );

    if (!match) {
      return null;
    }

    return {
      serviceName: match[1],
      direction: match[2] as "inbound" | "outbound",
      eventType: this.kebabToPascal(match[3]),
    };
  }

  /**
   * Convert kebab-case to PascalCase
   */
  private kebabToPascal(kebab: string): string {
    return kebab
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }
}
