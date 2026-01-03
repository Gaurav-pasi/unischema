/**
 * Generic backend handler wrapper for serverless functions
 */

import type { SchemaBuilder, InferInput } from '../../schema';
import type { ValidationResult, EnterpriseValidationResponse } from '../../types';
import { validate } from '../../core';
import { toEnterpriseResponse } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface HandlerContext<T> {
  /** Validated input data */
  data: T;
  /** Full validation result (includes soft errors) */
  validation: ValidationResult;
}

export interface HandlerResult<R> {
  /** Response data */
  data?: R;
  /** HTTP status code */
  statusCode: number;
  /** Response headers */
  headers?: Record<string, string>;
}

export type ValidatedHandler<T, R> = (
  context: HandlerContext<T>
) => Promise<R | HandlerResult<R>>;

export interface CreateHandlerOptions {
  /** Allow soft errors to pass */
  allowSoftErrors?: boolean;
  /** Transform input before validation */
  transform?: (input: unknown) => unknown;
}

// ============================================================================
// Handler Factory
// ============================================================================

/**
 * Create a validated handler for serverless functions
 *
 * @example
 * ```ts
 * export const handler = createHandler(UserSchema, async ({ data }) => {
 *   const user = await createUser(data);
 *   return { user };
 * });
 *
 * // In your serverless function:
 * const result = await handler(event.body);
 * return {
 *   statusCode: result.statusCode,
 *   body: JSON.stringify(result.body),
 * };
 * ```
 */
export function createHandler<
  S extends SchemaBuilder<Record<string, unknown>>,
  R
>(
  schema: S,
  handler: ValidatedHandler<InferInput<S>, R>,
  options: CreateHandlerOptions = {}
): (input: unknown) => Promise<{
  statusCode: number;
  body: R | EnterpriseValidationResponse;
  headers?: Record<string, string>;
}> {
  const { allowSoftErrors = true, transform } = options;

  return async (input: unknown) => {
    // Transform input if needed
    let data = transform ? transform(input) : input;

    // Parse JSON string if needed
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return {
          statusCode: 400,
          body: {
            status: 'validation_error',
            errors: [
              {
                field: '_root',
                code: 'INVALID_JSON',
                message: 'Invalid JSON input',
                severity: 'hard',
              },
            ],
            msg: 'Invalid JSON input',
            validation: {
              hard_validations: [
                {
                  field: '_root',
                  code: 'INVALID_JSON',
                  message: 'Invalid JSON input',
                  severity: 'hard',
                },
              ],
              soft_validations: [],
            },
          } as EnterpriseValidationResponse,
        };
      }
    }

    // Validate
    const validation = validate(schema.definition, data as Record<string, unknown>);

    // Check validation result
    if (!validation.valid) {
      return {
        statusCode: 400,
        body: toEnterpriseResponse(validation),
      };
    }

    if (!allowSoftErrors && validation.softErrors.length > 0) {
      return {
        statusCode: 400,
        body: toEnterpriseResponse(validation),
      };
    }

    // Execute handler
    try {
      const result = await handler({
        data: data as InferInput<S>,
        validation,
      });

      // Check if result is a HandlerResult
      if (
        result !== null &&
        typeof result === 'object' &&
        'statusCode' in result
      ) {
        const handlerResult = result as HandlerResult<R>;
        return {
          statusCode: handlerResult.statusCode,
          body: handlerResult.data as R,
          headers: handlerResult.headers,
        };
      }

      // Plain result
      return {
        statusCode: 200,
        body: result as R,
      };
    } catch (error) {
      // Handle errors
      const message = error instanceof Error ? error.message : 'Internal server error';
      return {
        statusCode: 500,
        body: {
          status: 'validation_error',
          errors: [
            {
              field: '_root',
              code: 'INTERNAL_ERROR',
              message,
              severity: 'hard',
            },
          ],
          msg: message,
          validation: {
            hard_validations: [],
            soft_validations: [],
          },
        } as EnterpriseValidationResponse,
      };
    }
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate data without a handler (useful for manual validation)
 */
export function validateInput<S extends SchemaBuilder<Record<string, unknown>>>(
  schema: S,
  input: unknown
): {
  valid: boolean;
  data: InferInput<S> | null;
  result: ValidationResult;
  response: EnterpriseValidationResponse;
} {
  const data = typeof input === 'string' ? JSON.parse(input) : input;
  const result = validate(schema.definition, data as Record<string, unknown>);

  return {
    valid: result.valid,
    data: result.valid ? (data as InferInput<S>) : null,
    result,
    response: toEnterpriseResponse(result, result.valid ? data : undefined),
  };
}

/**
 * Create a success response
 */
export function success<T>(data: T, statusCode: number = 200): HandlerResult<T> {
  return { data, statusCode };
}

/**
 * Create an error response
 */
export function error<T>(
  message: string,
  statusCode: number = 400
): HandlerResult<T> {
  return {
    statusCode,
    data: {
      status: 'validation_error',
      errors: [{ field: '_root', code: 'ERROR', message, severity: 'hard' }],
      msg: message,
      validation: { hard_validations: [], soft_validations: [] },
    } as unknown as T,
  };
}
