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
  validate,
  validateSchema,
  isValid,
  assertValid,
  mergeResults,
  validResult,
  errorResult,
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
  merge,
  field,
  type InferInput,
  type InferOutput,
  type SchemaBuilder,
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
  FieldType,
  ValidationRule,
  FieldDefinition,
  SchemaDefinition,
  ValidatorContext,
  ValidatorFn,
  EnterpriseValidationResponse,
} from './types';

export { toEnterpriseResponse } from './types';
