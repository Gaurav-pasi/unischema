/**
 * Core validation engine - runs unchanged in browser and Node.js
 */

import type {
  ValidationResult,
  ValidationError,
  FieldDefinition,
  SchemaDefinition,
  ValidatorContext,
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

  // Type validation first
  const typeValidator = getTypeValidator(fieldDef.type);
  if (typeValidator) {
    const typeError = typeValidator(value, undefined, context);
    if (typeError) {
      errors.push(typeError);
      // If type is wrong, skip other validations
      return errors;
    }
  }

  // Required validation
  if (fieldDef.required) {
    const requiredValidator = getValidator('required');
    if (requiredValidator) {
      const error = requiredValidator(value, undefined, context);
      if (error) {
        errors.push(error);
        // If required and missing, skip other validations
        return errors;
      }
    }
  } else if (value === undefined || value === null || value === '') {
    // Skip other validations for optional empty fields
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

    const error = validator(value, params, context);
    if (error) {
      errors.push(error);
    }
  }

  // Nested schema validation (for object fields)
  if (fieldDef.type === 'object' && fieldDef.schema && value !== null && value !== undefined) {
    const nestedResult = validateSchema(fieldDef.schema, value as Record<string, unknown>, context.path, context.root);
    errors.push(...nestedResult.hardErrors, ...nestedResult.softErrors);
  }

  // Array item validation
  if (fieldDef.type === 'array' && fieldDef.items && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const itemContext: ValidatorContext = {
        path: `${context.path}[${i}]`,
        root: context.root,
        parent: value,
      };
      const itemErrors = validateField(fieldDef.items, value[i], itemContext);
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
  root?: unknown
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
 * Main validation function
 */
export function validate<T extends Record<string, unknown>>(
  schema: SchemaDefinition,
  data: T
): ValidationResult {
  return validateSchema(schema, data);
}

/**
 * Check if data is valid (no hard errors)
 */
export function isValid(schema: SchemaDefinition, data: Record<string, unknown>): boolean {
  return validate(schema, data).valid;
}

/**
 * Validate and throw if invalid
 */
export function assertValid<T extends Record<string, unknown>>(
  schema: SchemaDefinition,
  data: T
): T {
  const result = validate(schema, data);
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
