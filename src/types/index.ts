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
  /** Path as array (e.g., ["address", "city"]) */
  path?: string[];
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Severity level - hard errors block submission, soft are warnings */
  severity: ValidationSeverity;
  /** Value that was received (for context) */
  received?: unknown;
  /** Expected value or constraints (for context) */
  expected?: unknown;
}

export interface ValidationResult {
  /** True if no hard errors exist */
  valid: boolean;
  /** Errors that block form submission */
  hardErrors: ValidationError[];
  /** Warnings that don't block submission */
  softErrors: ValidationError[];
  /** Errors aggregated by field path */
  errorsByField?: Record<string, ValidationError[]>;
}

/** Validation options */
export interface ValidationOptions {
  /** Custom error message formatter */
  errorMap?: (error: ValidationError) => ValidationError | { message: string };
  /** Stop validation on first error */
  abortEarly?: boolean;
  /** Aggregate errors by field */
  aggregateByField?: boolean;
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
  /** Is this an async validation? */
  async?: boolean;
  /** Debounce delay in ms for async validators */
  debounce?: number;
  /** Timeout in ms for async validators */
  timeout?: number;
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
  /** Transform functions to apply to value */
  transforms?: Array<(value: unknown) => unknown>;
  /** Preprocess function to apply before validation */
  preprocess?: (value: unknown) => unknown;
  /** Allow null values */
  nullable?: boolean;
  /** Allow null or undefined values */
  nullish?: boolean;
}

// ============================================================================
// Schema Types
// ============================================================================

export interface SchemaDefinition {
  /** Field definitions keyed by field name */
  fields: Record<string, FieldDefinition>;
  /** Schema metadata */
  meta?: Record<string, unknown>;
  /** Allow unknown keys to pass through */
  passthrough?: boolean;
  /** Strict mode - reject unknown keys */
  strict?: boolean;
  /** Catchall field definition for unknown keys */
  catchall?: FieldDefinition;
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

export type AsyncValidatorFn = (
  value: unknown,
  params: Record<string, unknown> | undefined,
  context: ValidatorContext
) => Promise<ValidationError | null>;

/** Async refine function type - returns boolean or validation result object */
export type AsyncRefineFn<T = unknown> = (
  value: T
) => Promise<boolean | { valid: boolean; message?: string }>;

/** Options for async validation */
export interface AsyncValidationOptions {
  /** Custom error message */
  message?: string;
  /** Debounce delay in ms */
  debounce?: number;
  /** Timeout in ms (default: 5000) */
  timeout?: number;
  /** Is this a soft validation (warning only)? */
  soft?: boolean;
  /** Cache results (useful for expensive checks) */
  cache?: boolean;
  /** Cache TTL in seconds (default: 3600) */
  cacheTTL?: number;
}

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
