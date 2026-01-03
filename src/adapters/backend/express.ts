/**
 * Express.js middleware adapter for FormSchema validation
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { SchemaBuilder, InferInput } from '../../schema';
import type { ValidationResult, EnterpriseValidationResponse } from '../../types';
import { validate } from '../../core';
import { toEnterpriseResponse } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface ValidateRequestOptions {
  /** Source of data to validate: body, query, or params */
  source?: 'body' | 'query' | 'params';
  /** Whether to allow soft errors to pass */
  allowSoftErrors?: boolean;
  /** Custom error response handler */
  onError?: (
    result: ValidationResult,
    req: Request,
    res: Response
  ) => void;
  /** Transform data before validation */
  transform?: (data: unknown) => unknown;
}

export interface ValidatedRequest<T> extends Request {
  /** Validated and typed data */
  validatedData: T;
  /** Full validation result */
  validationResult: ValidationResult;
}

// ============================================================================
// Default Error Handler
// ============================================================================

function defaultErrorHandler(
  result: ValidationResult,
  _req: Request,
  res: Response
): void {
  const response: EnterpriseValidationResponse = toEnterpriseResponse(result);
  res.status(400).json(response);
}

// ============================================================================
// Middleware Factory
// ============================================================================

/**
 * Create validation middleware for Express
 *
 * @example
 * ```ts
 * app.post('/users', validateRequest(UserSchema), (req, res) => {
 *   const data = req.validatedData; // Typed!
 * });
 * ```
 */
export function validateRequest<S extends SchemaBuilder<Record<string, unknown>>>(
  schema: S,
  options: ValidateRequestOptions = {}
): RequestHandler {
  const {
    source = 'body',
    allowSoftErrors = true,
    onError = defaultErrorHandler,
    transform,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Get data from the specified source
    let data: unknown;
    switch (source) {
      case 'body':
        data = req.body;
        break;
      case 'query':
        data = req.query;
        break;
      case 'params':
        data = req.params;
        break;
    }

    // Apply transformation if provided
    if (transform) {
      data = transform(data);
    }

    // Validate
    const result = validate(schema.definition, data as Record<string, unknown>);

    // Attach validation result to request
    (req as ValidatedRequest<InferInput<S>>).validationResult = result;

    // Check for hard errors
    if (!result.valid) {
      onError(result, req, res);
      return;
    }

    // Check for soft errors if not allowed
    if (!allowSoftErrors && result.softErrors.length > 0) {
      onError(result, req, res);
      return;
    }

    // Attach validated data
    (req as ValidatedRequest<InferInput<S>>).validatedData = data as InferInput<S>;

    next();
  };
}

/**
 * Create middleware that validates body
 */
export function validateBody<S extends SchemaBuilder<Record<string, unknown>>>(
  schema: S,
  options?: Omit<ValidateRequestOptions, 'source'>
): RequestHandler {
  return validateRequest(schema, { ...options, source: 'body' });
}

/**
 * Create middleware that validates query parameters
 */
export function validateQuery<S extends SchemaBuilder<Record<string, unknown>>>(
  schema: S,
  options?: Omit<ValidateRequestOptions, 'source'>
): RequestHandler {
  return validateRequest(schema, { ...options, source: 'query' });
}

/**
 * Create middleware that validates route parameters
 */
export function validateParams<S extends SchemaBuilder<Record<string, unknown>>>(
  schema: S,
  options?: Omit<ValidateRequestOptions, 'source'>
): RequestHandler {
  return validateRequest(schema, { ...options, source: 'params' });
}

// ============================================================================
// Handler Wrapper
// ============================================================================

type TypedHandler<T> = (
  req: ValidatedRequest<T>,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Wrap a handler with schema validation
 *
 * @example
 * ```ts
 * app.post('/users', withValidation(UserSchema, async (req, res) => {
 *   const { email, name } = req.validatedData; // Typed!
 *   // ...
 * }));
 * ```
 */
export function withValidation<S extends SchemaBuilder<Record<string, unknown>>>(
  schema: S,
  handler: TypedHandler<InferInput<S>>,
  options?: ValidateRequestOptions
): RequestHandler[] {
  return [
    validateRequest(schema, options),
    handler as RequestHandler,
  ];
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Send a successful validation response
 */
export function sendValidationSuccess(
  res: Response,
  data: unknown,
  message: string = 'Success'
): void {
  res.json({
    status: 'success',
    data,
    errors: [],
    msg: message,
    validation: {
      hard_validations: [],
      soft_validations: [],
    },
  } as EnterpriseValidationResponse);
}

/**
 * Send a validation error response
 */
export function sendValidationError(
  res: Response,
  result: ValidationResult,
  statusCode: number = 400
): void {
  res.status(statusCode).json(toEnterpriseResponse(result));
}
