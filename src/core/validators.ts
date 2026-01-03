/**
 * Built-in validators for common validation rules
 */

import type { ValidatorFn, ValidationError, ValidatorContext } from '../types';

// Import split validators for tree-shaking
import {
  emailValidator,
  urlValidator,
  ipAddressValidator,
  ipv6Validator,
  alphaValidator,
  alphanumericValidator,
  numericValidator,
  lowercaseValidator,
  uppercaseValidator,
  slugValidator,
  hexValidator,
  base64Validator,
  jsonValidator,
  lengthValidator,
  containsValidator,
  startsWithValidator,
  endsWithValidator,
} from '../validators/string';

import {
  portValidator,
  latitudeValidator,
  longitudeValidator,
  percentageValidator,
  betweenValidator as numberBetweenValidator,
  divisibleByValidator,
  multipleOfValidator,
  evenValidator,
  oddValidator,
  safeValidator,
  finiteValidator,
} from '../validators/number';

import {
  todayValidator,
  yesterdayValidator,
  tomorrowValidator,
  thisWeekValidator,
  thisMonthValidator,
  thisYearValidator,
  weekdayValidator,
  weekendValidator,
  ageValidator,
  betweenValidator as dateBetweenValidator,
} from '../validators/date';

import {
  includesValidator,
  excludesValidator,
  emptyValidator,
  notEmptyValidator,
  sortedValidator,
  compactValidator,
} from '../validators/array';

import {
  keysValidator,
  pickValidator,
  omitValidator,
  strictValidator,
} from '../validators/object';

import {
  notMatchesValidator,
  greaterThanValidator,
  lessThanValidator,
  whenValidator,
  dependsOnValidator,
} from '../validators/common';

/**
 * Create a validation error
 */
function createError(
  context: ValidatorContext,
  code: string,
  message: string,
  soft: boolean = false
): ValidationError {
  return {
    field: context.path,
    code,
    message,
    severity: soft ? 'soft' : 'hard',
  };
}

// ============================================================================
// Type Validators
// ============================================================================

export const typeValidators: Record<string, ValidatorFn> = {
  string: (value, _params, context) => {
    if (value !== undefined && value !== null && typeof value !== 'string') {
      return createError(context, 'INVALID_TYPE', `Expected string, got ${typeof value}`);
    }
    return null;
  },

  number: (value, _params, context) => {
    if (value !== undefined && value !== null && typeof value !== 'number') {
      return createError(context, 'INVALID_TYPE', `Expected number, got ${typeof value}`);
    }
    if (typeof value === 'number' && isNaN(value)) {
      return createError(context, 'INVALID_NUMBER', 'Value is not a valid number');
    }
    return null;
  },

  boolean: (value, _params, context) => {
    if (value !== undefined && value !== null && typeof value !== 'boolean') {
      return createError(context, 'INVALID_TYPE', `Expected boolean, got ${typeof value}`);
    }
    return null;
  },

  date: (value, _params, context) => {
    if (value === undefined || value === null) return null;
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return createError(context, 'INVALID_DATE', 'Invalid date value');
      }
      return null;
    }
    // Try parsing string dates
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) {
        return createError(context, 'INVALID_DATE', 'Invalid date format');
      }
      return null;
    }
    return createError(context, 'INVALID_TYPE', `Expected date, got ${typeof value}`);
  },

  array: (value, _params, context) => {
    if (value !== undefined && value !== null && !Array.isArray(value)) {
      return createError(context, 'INVALID_TYPE', `Expected array, got ${typeof value}`);
    }
    return null;
  },

  object: (value, _params, context) => {
    if (value !== undefined && value !== null) {
      if (typeof value !== 'object' || Array.isArray(value)) {
        return createError(context, 'INVALID_TYPE', `Expected object, got ${typeof value}`);
      }
    }
    return null;
  },
};

// ============================================================================
// Rule Validators
// ============================================================================

export const ruleValidators: Record<string, ValidatorFn> = {
  required: (value, _params, context) => {
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      return createError(context, 'REQUIRED', 'This field is required');
    }
    return null;
  },

  min: (value, params, context) => {
    const min = params?.value as number;
    const soft = params?.soft as boolean;
    const message = params?.message as string | undefined;

    if (value === undefined || value === null) return null;

    if (typeof value === 'number') {
      if (value < min) {
        return createError(
          context,
          'MIN_VALUE',
          message || `Value must be at least ${min}`,
          soft
        );
      }
    }

    if (typeof value === 'string') {
      if (value.length < min) {
        return createError(
          context,
          'MIN_LENGTH',
          message || `Must be at least ${min} characters`,
          soft
        );
      }
    }

    if (Array.isArray(value)) {
      if (value.length < min) {
        return createError(
          context,
          'MIN_ITEMS',
          message || `Must have at least ${min} items`,
          soft
        );
      }
    }

    return null;
  },

  max: (value, params, context) => {
    const max = params?.value as number;
    const soft = params?.soft as boolean;
    const message = params?.message as string | undefined;

    if (value === undefined || value === null) return null;

    if (typeof value === 'number') {
      if (value > max) {
        return createError(
          context,
          'MAX_VALUE',
          message || `Value must be at most ${max}`,
          soft
        );
      }
    }

    if (typeof value === 'string') {
      if (value.length > max) {
        return createError(
          context,
          'MAX_LENGTH',
          message || `Must be at most ${max} characters`,
          soft
        );
      }
    }

    if (Array.isArray(value)) {
      if (value.length > max) {
        return createError(
          context,
          'MAX_ITEMS',
          message || `Must have at most ${max} items`,
          soft
        );
      }
    }

    return null;
  },

  // String validators
  email: emailValidator,
  url: urlValidator,
  ipAddress: ipAddressValidator,
  ipv6: ipv6Validator,
  alpha: alphaValidator,
  alphanumeric: alphanumericValidator,
  numeric: numericValidator,
  lowercase: lowercaseValidator,
  uppercase: uppercaseValidator,
  slug: slugValidator,
  hex: hexValidator,
  base64: base64Validator,
  json: jsonValidator,
  length: lengthValidator,
  contains: containsValidator,
  startsWith: startsWithValidator,
  endsWith: endsWithValidator,

  // Number validators
  port: portValidator,
  latitude: latitudeValidator,
  longitude: longitudeValidator,
  percentage: percentageValidator,
  numberBetween: numberBetweenValidator,
  divisibleBy: divisibleByValidator,
  multipleOf: multipleOfValidator,
  even: evenValidator,
  odd: oddValidator,
  safe: safeValidator,
  finite: finiteValidator,

  // Date validators
  today: todayValidator,
  yesterday: yesterdayValidator,
  tomorrow: tomorrowValidator,
  thisWeek: thisWeekValidator,
  thisMonth: thisMonthValidator,
  thisYear: thisYearValidator,
  weekday: weekdayValidator,
  weekend: weekendValidator,
  age: ageValidator,
  dateBetween: dateBetweenValidator,

  // Array validators
  includes: includesValidator,
  excludes: excludesValidator,
  empty: emptyValidator,
  notEmpty: notEmptyValidator,
  sorted: sortedValidator,
  compact: compactValidator,

  // Object validators
  keys: keysValidator,
  pick: pickValidator,
  omit: omitValidator,
  strict: strictValidator,

  // Cross-field validators
  notMatches: notMatchesValidator,
  greaterThan: greaterThanValidator,
  lessThan: lessThanValidator,
  when: whenValidator,
  dependsOn: dependsOnValidator,

  pattern: (value, params, context) => {
    if (value === undefined || value === null || value === '') return null;

    const pattern = params?.pattern as string;
    const soft = params?.soft as boolean;
    const message = params?.message as string | undefined;

    if (typeof value !== 'string') return null;

    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      return createError(
        context,
        'PATTERN_MISMATCH',
        message || `Value does not match required pattern`,
        soft
      );
    }

    return null;
  },

  enum: (value, params, context) => {
    if (value === undefined || value === null) return null;

    const values = params?.values as unknown[];
    const soft = params?.soft as boolean;
    const message = params?.message as string | undefined;

    if (!values.includes(value)) {
      return createError(
        context,
        'INVALID_ENUM',
        message || `Value must be one of: ${values.join(', ')}`,
        soft
      );
    }

    return null;
  },

  custom: (value, params, context) => {
    const validate = params?.validate as (
      value: unknown,
      context: ValidatorContext
    ) => { valid: boolean; message?: string } | boolean;
    const soft = params?.soft as boolean;
    const message = params?.message as string | undefined;

    if (!validate) return null;

    const result = validate(value, context);

    if (typeof result === 'boolean') {
      if (!result) {
        return createError(
          context,
          'CUSTOM_VALIDATION',
          message || 'Validation failed',
          soft
        );
      }
      return null;
    }

    if (!result.valid) {
      return createError(
        context,
        'CUSTOM_VALIDATION',
        result.message || message || 'Validation failed',
        soft
      );
    }

    return null;
  },

  // Enterprise patterns - matches field against another field
  matches: (value, params, context) => {
    if (value === undefined || value === null) return null;

    const otherField = params?.field as string;
    const soft = params?.soft as boolean;
    const message = params?.message as string | undefined;
    const root = context.root as Record<string, unknown>;

    const otherValue = root[otherField];

    if (value !== otherValue) {
      return createError(
        context,
        'FIELD_MISMATCH',
        message || `Must match ${otherField}`,
        soft
      );
    }

    return null;
  },

  // Integer validation
  integer: (value, params, context) => {
    if (value === undefined || value === null) return null;

    const soft = params?.soft as boolean;
    const message = params?.message as string | undefined;

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return createError(
        context,
        'NOT_INTEGER',
        message || 'Value must be an integer',
        soft
      );
    }

    return null;
  },

  // Positive number validation
  positive: (value, params, context) => {
    if (value === undefined || value === null) return null;

    const soft = params?.soft as boolean;
    const message = params?.message as string | undefined;

    if (typeof value === 'number' && value <= 0) {
      return createError(
        context,
        'NOT_POSITIVE',
        message || 'Value must be positive',
        soft
      );
    }

    return null;
  },

  // Negative number validation
  negative: (value, params, context) => {
    if (value === undefined || value === null) return null;

    const soft = params?.soft as boolean;
    const message = params?.message as string | undefined;

    if (typeof value === 'number' && value >= 0) {
      return createError(
        context,
        'NOT_NEGATIVE',
        message || 'Value must be negative',
        soft
      );
    }

    return null;
  },
};

// ============================================================================
// Validator Registry
// ============================================================================

const customValidators: Map<string, ValidatorFn> = new Map();

/**
 * Register a custom validator
 */
export function registerValidator(name: string, validator: ValidatorFn): void {
  customValidators.set(name, validator);
}

/**
 * Get a validator by name
 */
export function getValidator(name: string): ValidatorFn | undefined {
  return ruleValidators[name] ?? customValidators.get(name);
}

/**
 * Get a type validator
 */
export function getTypeValidator(type: string): ValidatorFn | undefined {
  return typeValidators[type];
}
