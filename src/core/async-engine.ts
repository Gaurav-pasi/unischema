/**
 * Async validation engine for handling asynchronous validators
 */

import type {
  ValidationResult,
  ValidationError,
  FieldDefinition,
  SchemaDefinition,
  ValidatorContext,
  AsyncRefineFn,
} from '../types';

import { getValidator, getTypeValidator } from './validators';

// ============================================================================
// Debouncing Utility
// ============================================================================

interface DebounceCache {
  timeoutId?: NodeJS.Timeout | number;
  resolve?: (value: ValidationError | null) => void;
  reject?: (reason?: unknown) => void;
}

const debounceCache = new Map<string, DebounceCache>();

function createDebouncedValidation(
  key: string,
  validate: AsyncRefineFn,
  value: unknown,
  context: ValidatorContext,
  message?: string,
  soft: boolean = false,
  timeout: number = 5000,
  debounceMs: number = 300
): Promise<ValidationError | null> {
  const cache = debounceCache.get(key) || {};

  // Clear existing timeout
  if (cache.timeoutId !== undefined) {
    clearTimeout(cache.timeoutId as number);
  }

  // Reject previous pending validation
  if (cache.reject) {
    cache.reject(new Error('Validation cancelled - new input received'));
  }

  // Create new promise
  return new Promise<ValidationError | null>((resolve, reject) => {
    cache.resolve = resolve;
    cache.reject = reject;

    cache.timeoutId = setTimeout(async () => {
      try {
        const result = await executeAsyncValidator(validate, value, context, message, soft, timeout);
        resolve(result);
        debounceCache.delete(key);
      } catch (error) {
        reject(error);
        debounceCache.delete(key);
      }
    }, debounceMs);

    debounceCache.set(key, cache);
  });
}

// ============================================================================
// Timeout Wrapper
// ============================================================================

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

// ============================================================================
// Async Validator Handler
// ============================================================================

async function executeAsyncValidator(
  validate: AsyncRefineFn,
  value: unknown,
  context: ValidatorContext,
  message?: string,
  soft: boolean = false,
  timeout: number = 5000
): Promise<ValidationError | null> {
  try {
    const result = await withTimeout(
      validate(value),
      timeout,
      `Async validation timed out after ${timeout}ms`
    );

    // Handle boolean result
    if (typeof result === 'boolean') {
      if (result) {
        return null; // Valid
      }
      return {
        field: context.path,
        path: context.path.split('.'),
        code: 'ASYNC_VALIDATION_FAILED',
        message: message || 'Async validation failed',
        severity: soft ? 'soft' : 'hard',
        received: value,
      };
    }

    // Handle object result
    if (!result.valid) {
      return {
        field: context.path,
        path: context.path.split('.'),
        code: 'ASYNC_VALIDATION_FAILED',
        message: result.message || message || 'Async validation failed',
        severity: soft ? 'soft' : 'hard',
        received: value,
      };
    }

    return null; // Valid
  } catch (error) {
    // Handle validation errors
    return {
      field: context.path,
      path: context.path.split('.'),
      code: 'ASYNC_VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Async validation error',
      severity: soft ? 'soft' : 'hard',
      received: value,
    };
  }
}

// ============================================================================
// Async Field Validation
// ============================================================================

async function validateFieldAsync(
  fieldDef: FieldDefinition,
  value: unknown,
  context: ValidatorContext
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const asyncValidations: Promise<ValidationError | null>[] = [];

  // Type validation first (sync)
  const typeValidator = getTypeValidator(fieldDef.type);
  if (typeValidator) {
    const typeError = typeValidator(value, undefined, context);
    if (typeError) {
      errors.push({
        ...typeError,
        path: context.path.split('.'),
      });
      // If type is wrong, skip other validations
      return errors;
    }
  }

  // Required validation (sync)
  if (fieldDef.required) {
    const requiredValidator = getValidator('required');
    if (requiredValidator) {
      const error = requiredValidator(value, undefined, context);
      if (error) {
        errors.push({
          ...error,
          path: context.path.split('.'),
        });
        // If required and missing, skip other validations
        return errors;
      }
    }
  } else if (value === undefined || value === null || value === '') {
    // Skip other validations for optional empty fields
    return errors;
  }

  // Rule validations (sync and async)
  for (const rule of fieldDef.rules) {
    if (rule.async && rule.type === 'refineAsync') {
      // Handle async validation
      const validate = rule.params?.validate as AsyncRefineFn;
      if (!validate) continue;

      // Apply debouncing if specified
      if (rule.debounce && rule.debounce > 0) {
        const key = `${context.path}_${rule.type}`;
        asyncValidations.push(
          createDebouncedValidation(
            key,
            validate,
            value,
            context,
            rule.message,
            rule.soft,
            rule.timeout || 5000,
            rule.debounce
          )
        );
      } else {
        asyncValidations.push(
          executeAsyncValidator(
            validate,
            value,
            context,
            rule.message,
            rule.soft,
            rule.timeout || 5000
          )
        );
      }
    } else {
      // Handle sync validation
      const validator = getValidator(rule.type);
      if (!validator) {
        console.warn(`Unknown validator: ${rule.type}`);
        continue;
      }

      const params = {
        ...rule.params,
        soft: rule.soft,
        message: rule.message,
      };

      const error = validator(value, params, context);
      if (error) {
        errors.push({
          ...error,
          path: context.path.split('.'),
        });
      }
    }
  }

  // Wait for all async validations to complete
  const asyncErrors = await Promise.all(asyncValidations);
  for (const error of asyncErrors) {
    if (error) {
      errors.push(error);
    }
  }

  // Nested schema validation (for object fields)
  if (fieldDef.type === 'object' && fieldDef.schema && value !== null && value !== undefined) {
    const nestedResult = await validateSchemaAsync(
      fieldDef.schema,
      value as Record<string, unknown>,
      context.path,
      context.root
    );
    errors.push(...nestedResult.hardErrors, ...nestedResult.softErrors);
  }

  // Array item validation
  if (fieldDef.type === 'array' && fieldDef.items && Array.isArray(value)) {
    const itemValidations = value.map(async (item, i) => {
      const itemContext: ValidatorContext = {
        path: `${context.path}[${i}]`,
        root: context.root,
        parent: value,
      };
      return validateFieldAsync(fieldDef.items!, item, itemContext);
    });

    const itemResults = await Promise.all(itemValidations);
    for (const itemErrors of itemResults) {
      errors.push(...itemErrors);
    }
  }

  return errors;
}

// ============================================================================
// Async Schema Validation
// ============================================================================

export async function validateSchemaAsync(
  schema: SchemaDefinition,
  data: Record<string, unknown>,
  basePath: string = '',
  root?: unknown
): Promise<ValidationResult> {
  const hardErrors: ValidationError[] = [];
  const softErrors: ValidationError[] = [];

  const rootData = root ?? data;

  const fieldValidations = Object.entries(schema.fields).map(async ([fieldName, fieldDef]) => {
    const value = data[fieldName];
    const path = basePath ? `${basePath}.${fieldName}` : fieldName;

    const context: ValidatorContext = {
      path,
      root: rootData,
      parent: data,
    };

    return validateFieldAsync(fieldDef, value, context);
  });

  const results = await Promise.all(fieldValidations);

  for (const errors of results) {
    for (const error of errors) {
      if (error.severity === 'soft') {
        softErrors.push(error);
      } else {
        hardErrors.push(error);
      }
    }
  }

  return {
    valid: hardErrors.length === 0,
    hardErrors,
    softErrors,
  };
}

/**
 * Main async validation function
 */
export async function validateAsync<T extends Record<string, unknown>>(
  schema: SchemaDefinition,
  data: T
): Promise<ValidationResult> {
  return validateSchemaAsync(schema, data);
}

/**
 * Check if data is valid async (no hard errors)
 */
export async function isValidAsync(
  schema: SchemaDefinition,
  data: Record<string, unknown>
): Promise<boolean> {
  const result = await validateAsync(schema, data);
  return result.valid;
}

/**
 * Validate async and throw if invalid
 */
export async function assertValidAsync<T extends Record<string, unknown>>(
  schema: SchemaDefinition,
  data: T
): Promise<T> {
  const result = await validateAsync(schema, data);
  if (!result.valid) {
    const error = new Error('Async validation failed');
    (error as Error & { errors: ValidationError[] }).errors = result.hardErrors;
    throw error;
  }
  return data;
}
