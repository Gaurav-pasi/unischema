/**
 * Shared utilities for validators
 */

import type { ValidationError, ValidatorContext } from '../types';

/**
 * Create a validation error
 */
export function createError(
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

/**
 * Check if value is empty (null, undefined, or empty string)
 */
export function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * Check if value is a valid string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a valid number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a valid date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Parse a date from various formats
 */
export function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if value is a plain object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
