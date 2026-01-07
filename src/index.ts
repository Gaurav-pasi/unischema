/**
 * FormSchema - Schema-Driven, Isomorphic Form & Validation Engine
 *
 * @example
 * ```ts
 * import { schema, field, validate } from 'formschema';
 *
 * // Define schema once
 * const UserSchema = schema({
 *   email: field.string().email().required(),
 *   age: field.number().min(18),
 *   name: field.string().min(2).max(100),
 * });
 *
 * // Use same schema on frontend and backend
 * const result = validate(UserSchema.definition, userData);
 *
 * // TypeScript knows the shape
 * type User = InferInput<typeof UserSchema>;
 * ```
 */

// ============================================================================
// Core Exports
// ============================================================================

export {
  // Sync validation
  validate,
  validateSchema,
  isValid,
  assertValid,
  mergeResults,
  validResult,
  errorResult,
  // Async validation
  validateAsync,
  validateSchemaAsync,
  isValidAsync,
  assertValidAsync,
  // Validators
  registerValidator,
  getValidator,
  getTypeValidator,
  ruleValidators,
  typeValidators,
} from './core';

// ============================================================================
// Schema Exports
// ============================================================================

export {
  schema,
  extend,
  pick,
  omit,
  partial,
  deepPartial,
  passthrough,
  strict,
  catchall,
  required,
  optional,
  merge,
  field,
  coerce,
  type InferInput,
  type InferOutput,
  type SchemaBuilder,
  type DeepPartial,
  BaseFieldBuilder,
  StringFieldBuilder,
  NumberFieldBuilder,
  BooleanFieldBuilder,
  DateFieldBuilder,
  ArrayFieldBuilder,
  ObjectFieldBuilder,
  EnumFieldBuilder,
} from './schema';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  ValidationSeverity,
  ValidationError,
  ValidationResult,
  ValidationOptions,
  FieldType,
  ValidationRule,
  FieldDefinition,
  SchemaDefinition,
  ValidatorContext,
  ValidatorFn,
  AsyncValidatorFn,
  AsyncRefineFn,
  AsyncValidationOptions,
  EnterpriseValidationResponse,
} from './types';

export { toEnterpriseResponse } from './types';
