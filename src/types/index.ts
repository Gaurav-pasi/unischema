/**
 * Core types for the FormSchema validation engine
 */

// ============================================================================
// Validation Result Types
// ============================================================================

export type ValidationSeverity = 'hard' | 'soft';

export interface ValidationError {
  /** Field path (e.g., "email" or "address.city") */
  field: string;
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Severity level - hard errors block submission, soft are warnings */
  severity: ValidationSeverity;
}

export interface ValidationResult {
  /** True if no hard errors exist */
  valid: boolean;
  /** Errors that block form submission */
  hardErrors: ValidationError[];
  /** Warnings that don't block submission */
  softErrors: ValidationError[];
}

// ============================================================================
// Field Definition Types
// ============================================================================

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object';

export interface ValidationRule {
  /** Rule type identifier */
  type: string;
  /** Rule parameters */
  params?: Record<string, unknown>;
  /** Custom error message */
  message?: string;
  /** Is this a soft validation (warning only)? */
  soft?: boolean;
}

export interface FieldDefinition<T = unknown> {
  /** The base type of this field */
  type: FieldType;
  /** Validation rules to apply */
  rules: ValidationRule[];
  /** Is this field required? */
  required: boolean;
  /** Default value */
  defaultValue?: T;
  /** For nested schemas */
  schema?: SchemaDefinition;
  /** For array items */
  items?: FieldDefinition;
  /** Field metadata */
  meta?: Record<string, unknown>;
}

// ============================================================================
// Schema Types
// ============================================================================

export interface SchemaDefinition {
  /** Field definitions keyed by field name */
  fields: Record<string, FieldDefinition>;
  /** Schema metadata */
  meta?: Record<string, unknown>;
}

// ============================================================================
// Type Inference Utilities
// ============================================================================

/** Infer TypeScript type from a field definition */
export type InferFieldType<F extends FieldDefinition> =
  F['type'] extends 'string' ? string :
  F['type'] extends 'number' ? number :
  F['type'] extends 'boolean' ? boolean :
  F['type'] extends 'date' ? Date :
  F['type'] extends 'array' ?
    F['items'] extends FieldDefinition ? InferFieldType<F['items']>[] : unknown[] :
  F['type'] extends 'object' ?
    F['schema'] extends SchemaDefinition ? InferSchemaType<F['schema']> : Record<string, unknown> :
  unknown;

/** Infer TypeScript type from a schema definition */
export type InferSchemaType<S extends SchemaDefinition> = {
  [K in keyof S['fields']]: InferFieldType<S['fields'][K]>;
};

// ============================================================================
// Validator Function Types
// ============================================================================

export interface ValidatorContext {
  /** Current field path */
  path: string;
  /** Full data object being validated */
  root: unknown;
  /** Parent object containing this field */
  parent?: unknown;
}

export type ValidatorFn = (
  value: unknown,
  params: Record<string, unknown> | undefined,
  context: ValidatorContext
) => ValidationError | null;

// ============================================================================
// Enterprise-Compatible Response Types
// ============================================================================

export interface EnterpriseValidationResponse {
  status: 'success' | 'validation_error';
  data?: unknown;
  errors: ValidationError[];
  msg: string;
  validation: {
    hard_validations: ValidationError[];
    soft_validations: ValidationError[];
  };
}

/**
 * Convert ValidationResult to enterprise-compatible response format
 */
export function toEnterpriseResponse(
  result: ValidationResult,
  data?: unknown
): EnterpriseValidationResponse {
  return {
    status: result.valid ? 'success' : 'validation_error',
    data: result.valid ? data : undefined,
    errors: [...result.hardErrors, ...result.softErrors],
    msg: result.valid ? 'Validation successful' : 'Validation failed',
    validation: {
      hard_validations: result.hardErrors,
      soft_validations: result.softErrors,
    },
  };
}
