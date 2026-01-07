/**
 * Core validation engine - runs unchanged in browser and Node.js
 */

import type {
  ValidationResult,
  ValidationError,
  FieldDefinition,
  SchemaDefinition,
  ValidatorContext,
  ValidationOptions,
} from '../types';

import { getValidator, getTypeValidator } from './validators';

/**
 * Validate a single field
 */
function validateField(
  fieldDef: FieldDefinition,
  value: unknown,
  context: ValidatorContext
): ValidationError[] {
  const errors: ValidationError[] = [];
  let processedValue = value;

  // Check for nullish values first
  if (value === null || value === undefined) {
    if (fieldDef.nullish || (fieldDef.nullable && value === null)) {
      // Allow null/undefined
      if (!fieldDef.required) {
        return errors; // Valid nullish optional field
      }
    }
  }

  // Apply preprocessing if defined
  if (fieldDef.preprocess) {
    processedValue = fieldDef.preprocess(value);
  }

  // Apply transforms
  if (fieldDef.transforms && fieldDef.transforms.length > 0) {
    for (const transform of fieldDef.transforms) {
      processedValue = transform(processedValue);
    }
  }

  // Type validation first
  const typeValidator = getTypeValidator(fieldDef.type);
  if (typeValidator) {
    const typeError = typeValidator(processedValue, undefined, context);
    if (typeError) {
      errors.push({
        ...typeError,
        path: context.path.split('.').filter(p => p !== ''),
      });
      // If type is wrong, skip other validations
      return errors;
    }
  }

  // Required validation
  if (fieldDef.required) {
    // Check if value is missing, considering nullable/nullish
    const isMissing =
      (processedValue === undefined && !fieldDef.nullish) ||
      (processedValue === null && !fieldDef.nullable && !fieldDef.nullish) ||
      (processedValue === '' && !fieldDef.nullable && !fieldDef.nullish) ||
      (Array.isArray(processedValue) && processedValue.length === 0);

    if (isMissing) {
      const requiredValidator = getValidator('required');
      if (requiredValidator) {
        const error = requiredValidator(processedValue, undefined, context);
        if (error) {
          errors.push({
            ...error,
            path: context.path.split('.').filter(p => p !== ''),
          });
          // If required and missing, skip other validations
          return errors;
        }
      }
    }
  } else if (value === undefined || value === null || value === '') {
    // Skip other validations for optional empty fields (check original value, not processed)
    return errors;
  }

  // Rule validations
  for (const rule of fieldDef.rules) {
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

    const error = validator(processedValue, params, context);
    if (error) {
      errors.push({
        ...error,
        path: context.path.split('.').filter(p => p !== ''),
      });
    }
  }

  // Nested schema validation (for object fields)
  if (fieldDef.type === 'object' && fieldDef.schema && processedValue !== null && processedValue !== undefined) {
    const nestedResult = validateSchema(fieldDef.schema, processedValue as Record<string, unknown>, context.path, context.root);
    errors.push(...nestedResult.hardErrors, ...nestedResult.softErrors);
  }

  // Array item validation
  if (fieldDef.type === 'array' && fieldDef.items && Array.isArray(processedValue)) {
    for (let i = 0; i < processedValue.length; i++) {
      const itemContext: ValidatorContext = {
        path: `${context.path}[${i}]`,
        root: context.root,
        parent: processedValue,
      };
      const itemErrors = validateField(fieldDef.items, processedValue[i], itemContext);
      errors.push(...itemErrors);
    }
  }

  return errors;
}

/**
 * Validate data against a schema
 */
export function validateSchema(
  schema: SchemaDefinition,
  data: Record<string, unknown>,
  basePath: string = '',
  root?: unknown,
  options?: ValidationOptions
): ValidationResult {
  const hardErrors: ValidationError[] = [];
  const softErrors: ValidationError[] = [];

  const rootData = root ?? data;

  for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
    const value = data[fieldName];
    const path = basePath ? `${basePath}.${fieldName}` : fieldName;

    const context: ValidatorContext = {
      path,
      root: rootData,
      parent: data,
    };

    const errors = validateField(fieldDef, value, context);

    for (let error of errors) {
      // Apply errorMap if provided
      if (options?.errorMap) {
        const mapped = options.errorMap(error);
        if ('message' in mapped && !('field' in mapped)) {
          // Simple message mapping
          error = { ...error, message: mapped.message };
        } else {
          // Full error object mapping
          error = mapped as ValidationError;
        }
      }

      if (error.severity === 'soft') {
        softErrors.push(error);
      } else {
        hardErrors.push(error);
        // Abort early if requested
        if (options?.abortEarly) {
          return buildValidationResult(hardErrors, softErrors, options);
        }
      }
    }
  }

  return buildValidationResult(hardErrors, softErrors, options);
}

/**
 * Build validation result with optional field aggregation
 */
function buildValidationResult(
  hardErrors: ValidationError[],
  softErrors: ValidationError[],
  options?: ValidationOptions
): ValidationResult {
  const result: ValidationResult = {
    valid: hardErrors.length === 0,
    hardErrors,
    softErrors,
  };

  // Aggregate errors by field if requested
  if (options?.aggregateByField) {
    const errorsByField: Record<string, ValidationError[]> = {};

    for (const error of [...hardErrors, ...softErrors]) {
      const field = error.field;
      if (!errorsByField[field]) {
        errorsByField[field] = [];
      }
      errorsByField[field].push(error);
    }

    result.errorsByField = errorsByField;
  }

  return result;
}

/**
 * Main validation function
 */
export function validate<T extends Record<string, unknown>>(
  schema: SchemaDefinition,
  data: T,
  options?: ValidationOptions
): ValidationResult {
  return validateSchema(schema, data, '', undefined, options);
}

/**
 * Check if data is valid (no hard errors)
 */
export function isValid(
  schema: SchemaDefinition,
  data: Record<string, unknown>,
  options?: ValidationOptions
): boolean {
  return validate(schema, data, options).valid;
}

/**
 * Validate and throw if invalid
 */
export function assertValid<T extends Record<string, unknown>>(
  schema: SchemaDefinition,
  data: T,
  options?: ValidationOptions
): T {
  const result = validate(schema, data, options);
  if (!result.valid) {
    const error = new Error('Validation failed');
    (error as Error & { errors: ValidationError[] }).errors = result.hardErrors;
    throw error;
  }
  return data;
}

/**
 * Merge multiple validation results
 */
export function mergeResults(...results: ValidationResult[]): ValidationResult {
  const hardErrors: ValidationError[] = [];
  const softErrors: ValidationError[] = [];

  for (const result of results) {
    hardErrors.push(...result.hardErrors);
    softErrors.push(...result.softErrors);
  }

  return {
    valid: hardErrors.length === 0,
    hardErrors,
    softErrors,
  };
}

/**
 * Create an empty valid result
 */
export function validResult(): ValidationResult {
  return {
    valid: true,
    hardErrors: [],
    softErrors: [],
  };
}

/**
 * Create a result with a single error
 */
export function errorResult(
  field: string,
  code: string,
  message: string,
  soft: boolean = false
): ValidationResult {
  const error: ValidationError = {
    field,
    code,
    message,
    severity: soft ? 'soft' : 'hard',
  };

  return {
    valid: soft,
    hardErrors: soft ? [] : [error],
    softErrors: soft ? [error] : [],
  };
}
