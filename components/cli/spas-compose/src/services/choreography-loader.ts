/**
 * ChoreographyLoader - Loads and validates choreography.yaml files
 */

import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";
import type { Choreography, Flow, EventRoute } from "../types.js";

/**
 * Result from loading choreography
 */
export interface LoadResult {
  success: boolean;
  choreography?: Choreography;
  error?: {
    code: string;
    details: string;
  };
}

/**
 * Result from validating choreography
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Service for loading and validating choreography configuration
 */
export class ChoreographyLoader {
  private readonly choreographyPath: string;
  public readonly workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.choreographyPath = path.join(workspacePath, "choreography.yaml");
  }

  /**
   * Load choreography.yaml from workspace
   */
  load(): LoadResult {
    if (!fs.existsSync(this.choreographyPath)) {
      return {
        success: false,
        error: {
          code: "FILE_NOT_FOUND",
          details: `choreography.yaml not found at ${this.choreographyPath}`,
        },
      };
    }

    try {
      const content = fs.readFileSync(this.choreographyPath, "utf-8");
      const parsed = yaml.load(content) as Choreography;

      return {
        success: true,
        choreography: parsed,
      };
    } catch (error) {
      const yamlError = error as yaml.YAMLException;
      return {
        success: false,
        error: {
          code: "INVALID_YAML",
          details: yamlError.message || "Failed to parse YAML",
        },
      };
    }
  }

  /**
   * Validate choreography structure against schema
   */
  validate(choreography: Choreography): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!choreography.version) {
      errors.push("version is required");
    } else if (choreography.version !== "1.0") {
      warnings.push(
        `Unknown version "${choreography.version}", expected "1.0"`,
      );
    }

    if (!choreography.domain) {
      errors.push("domain is required");
    } else if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(choreography.domain)) {
      errors.push('domain must be lowercase-hyphenated (e.g., "my-domain")');
    }

    if (!choreography.flows || Object.keys(choreography.flows).length === 0) {
      errors.push("flows is required");
    } else {
      // Validate each flow
      for (const [flowName, flow] of Object.entries(choreography.flows)) {
        this.validateFlow(flowName, flow, errors, warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single flow
   */
  private validateFlow(
    flowName: string,
    flow: Flow,
    errors: string[],
    warnings: string[],
  ): void {
    const prefix = `flows.${flowName}`;

    // Validate flow name format
    if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(flowName)) {
      errors.push(`${prefix}: flow name must be lowercase-hyphenated`);
    }

    // Validate participants
    // Terminal-only flows (all events have empty targets) can have 1 participant
    // Choreographed flows (events with targets) must have at least 2 participants
    const hasAnyTargets = flow.events?.some((e) => e.targets && e.targets.length > 0) ?? false;
    const minParticipants = hasAnyTargets ? 2 : 1;
    
    if (!flow.participants || flow.participants.length < minParticipants) {
      errors.push(`${prefix}: must have at least ${minParticipants} participant(s)`);
    } else {
      for (const participant of flow.participants) {
        if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(participant)) {
          errors.push(
            `${prefix}.participants: "${participant}" must be lowercase-hyphenated`,
          );
        }
      }
    }

    // Validate commands (optional)
    if (flow.commands && flow.commands.length > 0) {
      for (let i = 0; i < flow.commands.length; i++) {
        const cmd = flow.commands[i];
        const cmdPrefix = `${prefix}.commands[${i}]`;

        if (!cmd.service) {
          errors.push(`${cmdPrefix}: service is required`);
        } else if (flow.participants && !flow.participants.includes(cmd.service)) {
          warnings.push(
            `${cmdPrefix}: service "${cmd.service}" is not in participants list`,
          );
        }

        if (!cmd.command) {
          errors.push(`${cmdPrefix}: command is required`);
        } else if (!this.isValidCommandIdentifier(cmd.command)) {
          errors.push(
            `${cmdPrefix}: command "${cmd.command}" must be kebab-case (recommended) or PascalCase`,
          );
        }

        if (!cmd.endpoint) {
          errors.push(`${cmdPrefix}: endpoint is required`);
        } else if (typeof cmd.endpoint !== "string" || !cmd.endpoint.startsWith("/")) {
          errors.push(`${cmdPrefix}: endpoint "${cmd.endpoint}" must start with "/"`);
        }
      }
    }

    const hasCommands = !!flow.commands && flow.commands.length > 0;
    const hasEvents = !!flow.events && flow.events.length > 0;

    // A flow can be command-only, event-only, or both.
    if (!hasCommands && !hasEvents) {
      errors.push(
        `${prefix}: must have at least 1 command entry (commands) or 1 event route (events)`,
      );
      return;
    }

    // Validate events (optional)
    if (hasEvents) {
      for (let i = 0; i < flow.events!.length; i++) {
        this.validateEventRoute(
          `${prefix}.events[${i}]`,
          flow.events![i],
          flow.participants,
          errors,
          warnings,
        );
      }
    }
  }

  /**
   * Validate a single event route
   */
  private validateEventRoute(
    prefix: string,
    route: EventRoute,
    participants: string[],
    errors: string[],
    warnings: string[],
  ): void {
    // Required fields
    if (!route.source) {
      errors.push(`${prefix}: source is required`);
    } else if (!participants.includes(route.source)) {
      warnings.push(
        `${prefix}: source "${route.source}" is not in participants list`,
      );
    }

    if (!route.event) {
      errors.push(`${prefix}: event is required`);
    } else if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(route.event)) {
      errors.push(`${prefix}: event "${route.event}" must be kebab-case`);
    }

    if (!route.topic) {
      errors.push(`${prefix}: topic is required`);
    } else if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(route.topic)) {
      errors.push(
        `${prefix}: topic "${route.topic}" must be lowercase-hyphenated`,
      );
    }

    // Targets array is required but can be empty (terminal events)
    if (!route.targets) {
      errors.push(`${prefix}: targets is required (use empty array for terminal events)`);
    } else if (route.targets.length > 0) {
      for (let i = 0; i < route.targets.length; i++) {
        const target = route.targets[i];
        if (!target.service) {
          errors.push(`${prefix}.targets[${i}]: service is required`);
        } else if (!participants.includes(target.service)) {
          warnings.push(
            `${prefix}.targets[${i}]: service "${target.service}" is not in participants list`,
          );
        }

        if (target.command && !this.isValidCommandIdentifier(target.command)) {
          errors.push(
            `${prefix}.targets[${i}]: command "${target.command}" must be kebab-case (recommended) or PascalCase`,
          );
        }

        if (target.transform && !/\.jsonata$/.test(target.transform)) {
          errors.push(
            `${prefix}.targets[${i}]: transform must be a .jsonata file`,
          );
        }
      }
    }
  }

  private isValidCommandIdentifier(value: string): boolean {
    // Support both formats:
    // - canonical: kebab-case (preferred)
    // - endpoint-style: PascalCase (legacy)
    return (
      /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) ||
      /^[A-Z][A-Za-z0-9]*$/.test(value)
    );
  }

  /**
   * Get list of all participants from all flows
   */
  getAllParticipants(choreography: Choreography): string[] {
    const participants = new Set<string>();

    for (const flow of Object.values(choreography.flows)) {
      for (const participant of flow.participants) {
        participants.add(participant);
      }
    }

    return Array.from(participants);
  }

  /**
   * Get list of all transformation files referenced
   */
  getAllTransformations(choreography: Choreography): string[] {
    const transforms = new Set<string>();

    for (const flow of Object.values(choreography.flows)) {
      if (!flow.events) continue;
      
      for (const event of flow.events) {
        for (const target of event.targets) {
          if (target.transform) {
            transforms.add(target.transform);
          }
        }
      }
    }

    return Array.from(transforms);
  }
}
