/**
 * Frontend utility functions for validation and error handling
 */

import type { ValidationResult, ValidationError } from '../../types';

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Get the first error message for a field
 */
export function getFieldError(
  result: ValidationResult,
  field: string
): string | undefined {
  const error = result.hardErrors.find((e) => e.field === field);
  return error?.message;
}

/**
 * Get all error messages for a field
 */
export function getFieldErrors(
  result: ValidationResult,
  field: string
): string[] {
  return result.hardErrors
    .filter((e) => e.field === field)
    .map((e) => e.message);
}

/**
 * Get the first warning message for a field
 */
export function getFieldWarning(
  result: ValidationResult,
  field: string
): string | undefined {
  const warning = result.softErrors.find((e) => e.field === field);
  return warning?.message;
}

/**
 * Get all warning messages for a field
 */
export function getFieldWarnings(
  result: ValidationResult,
  field: string
): string[] {
  return result.softErrors
    .filter((e) => e.field === field)
    .map((e) => e.message);
}

/**
 * Check if a field has errors
 */
export function hasFieldError(result: ValidationResult, field: string): boolean {
  return result.hardErrors.some((e) => e.field === field);
}

/**
 * Check if a field has warnings
 */
export function hasFieldWarning(result: ValidationResult, field: string): boolean {
  return result.softErrors.some((e) => e.field === field);
}

/**
 * Group errors by field
 */
export function groupErrorsByField(
  errors: ValidationError[]
): Record<string, ValidationError[]> {
  const grouped: Record<string, ValidationError[]> = {};

  for (const error of errors) {
    if (!grouped[error.field]) {
      grouped[error.field] = [];
    }
    grouped[error.field]!.push(error);
  }

  return grouped;
}

/**
 * Convert validation result to a simple error map
 */
export function toErrorMap(result: ValidationResult): Record<string, string> {
  const map: Record<string, string> = {};

  for (const error of result.hardErrors) {
    if (!map[error.field]) {
      map[error.field] = error.message;
    }
  }

  return map;
}

/**
 * Convert validation result to a warnings map
 */
export function toWarningsMap(result: ValidationResult): Record<string, string> {
  const map: Record<string, string> = {};

  for (const warning of result.softErrors) {
    if (!map[warning.field]) {
      map[warning.field] = warning.message;
    }
  }

  return map;
}

// ============================================================================
// API Response Handling
// ============================================================================

/**
 * Parse errors from an API response
 */
export function parseApiErrors(response: {
  errors?: ValidationError[];
  validation?: {
    hard_validations?: ValidationError[];
    soft_validations?: ValidationError[];
  };
}): ValidationResult {
  const hardErrors: ValidationError[] = [];
  const softErrors: ValidationError[] = [];

  // Handle flat errors array
  if (response.errors) {
    for (const error of response.errors) {
      if (error.severity === 'soft') {
        softErrors.push(error);
      } else {
        hardErrors.push(error);
      }
    }
  }

  // Handle structured validation object
  if (response.validation) {
    if (response.validation.hard_validations) {
      hardErrors.push(...response.validation.hard_validations);
    }
    if (response.validation.soft_validations) {
      softErrors.push(...response.validation.soft_validations);
    }
  }

  return {
    valid: hardErrors.length === 0,
    hardErrors,
    softErrors,
  };
}

// ============================================================================
// Debouncing
// ============================================================================

/**
 * Create a debounced validation function
 */
export function debounceValidation<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: unknown[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        resolve(fn(...args));
      }, delay);
    });
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return debounced;
}

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Get the first field with an error
 */
export function getFirstErrorField(result: ValidationResult): string | undefined {
  return result.hardErrors[0]?.field;
}

/**
 * Focus the first field with an error (browser only)
 */
export function focusFirstError(
  result: ValidationResult,
  options: { scrollIntoView?: boolean } = {}
): void {
  const field = getFirstErrorField(result);
  if (!field) return;

  // Try to find element by name or id
  const element =
    document.querySelector<HTMLElement>(`[name="${field}"]`) ||
    document.getElementById(field);

  if (element) {
    element.focus();
    if (options.scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// ============================================================================
// Value Coercion
// ============================================================================

/**
 * Coerce form values to appropriate types based on schema
 */
export function coerceValue(value: unknown, type: string): unknown {
  if (value === '' || value === undefined || value === null) {
    return type === 'string' ? '' : undefined;
  }

  switch (type) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? undefined : num;

    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      return Boolean(value);

    case 'date':
      if (value instanceof Date) return value;
      const date = new Date(value as string);
      return isNaN(date.getTime()) ? undefined : date;

    case 'array':
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [value];
        } catch {
          return [value];
        }
      }
      return [value];

    default:
      return value;
  }
}
