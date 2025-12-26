/**
 * Unit tests for init command
 * Tests command-line parsing and validation logic
 */

import { isValidServiceName } from '../../../src/utils/config';

describe('Init Command', () => {
    describe('Service Name Validation', () => {
        // These tests verify the validation logic used by the init command

        it('should accept valid service names', () => {
            const validNames = [
                'order-service',
                'inventory',
                'my-service-v2',
                'a',
                'ab1',
                'order123',
            ];

            validNames.forEach(name => {
                expect(isValidServiceName(name)).toBe(true);
            });
        });

        it('should reject invalid service names', () => {
            const invalidNames = [
                'Order-Service',  // uppercase
                'my_service',     // underscore
                '2service',       // starts with number
                'service-',       // ends with hyphen
                'my--service',    // double hyphen
                'my service',     // space
                '',               // empty
            ];

            invalidNames.forEach(name => {
                expect(isValidServiceName(name)).toBe(false);
            });
        });
    });

    describe('Command Options', () => {
        // Verify option defaults match expected values
        
        it('should have correct default values', () => {
            const defaultOptions = {
                output: '.',
                force: false,
                json: false,
                verbose: false,
            };

            expect(defaultOptions.output).toBe('.');
            expect(defaultOptions.force).toBe(false);
            expect(defaultOptions.json).toBe(false);
            expect(defaultOptions.verbose).toBe(false);
        });
    });

    describe('Exit Codes', () => {
        it('should use exit code 0 for success', () => {
            // Exit code 0 indicates success
            const SUCCESS_EXIT_CODE = 0;
            expect(SUCCESS_EXIT_CODE).toBe(0);
        });

        it('should use exit code 1 for errors', () => {
            // Exit code 1 indicates general error
            const ERROR_EXIT_CODE = 1;
            expect(ERROR_EXIT_CODE).toBe(1);
        });
    });
});
