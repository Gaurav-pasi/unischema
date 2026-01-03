/**
 * Headless form utilities for frontend frameworks
 * Framework-agnostic - no React, Vue, or Svelte dependencies
 */

import type { SchemaBuilder, InferInput } from '../../schema';
import type { ValidationResult, ValidationError } from '../../types';
import { validate } from '../../core';

// ============================================================================
// Types
// ============================================================================

export interface FormState<T> {
  /** Current form values */
  values: T;
  /** Current validation errors by field */
  errors: Record<string, ValidationError[]>;
  /** Fields that have been touched (blurred) */
  touched: Set<string>;
  /** Fields that have been modified */
  dirty: Set<string>;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Whether form has been submitted at least once */
  isSubmitted: boolean;
  /** Whether form is valid (no hard errors) */
  isValid: boolean;
  /** Soft warnings by field */
  warnings: Record<string, ValidationError[]>;
}

export interface FormOptions<T> {
  /** Initial form values */
  initialValues?: Partial<T>;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Custom submit handler */
  onSubmit?: (values: T, helpers: FormHelpers<T>) => void | Promise<void>;
  /** Called when validation fails */
  onValidationError?: (result: ValidationResult) => void;
}

export interface FormHelpers<T> {
  /** Reset form to initial values */
  reset: () => void;
  /** Set form submitting state */
  setSubmitting: (isSubmitting: boolean) => void;
  /** Set field value */
  setFieldValue: (field: keyof T, value: unknown) => void;
  /** Set field error manually */
  setFieldError: (field: keyof T, error: string) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Set server errors from API response */
  setServerErrors: (errors: ValidationError[]) => void;
}

export interface FieldProps {
  /** Field name */
  name: string;
  /** Current value */
  value: unknown;
  /** Change handler */
  onChange: (value: unknown) => void;
  /** Blur handler */
  onBlur: () => void;
  /** Whether field has error */
  hasError: boolean;
  /** Error message (first error) */
  error: string | undefined;
  /** All error messages */
  errors: string[];
  /** Whether field has warning */
  hasWarning: boolean;
  /** Warning message (first warning) */
  warning: string | undefined;
  /** All warning messages */
  warnings: string[];
  /** Whether field has been touched */
  touched: boolean;
  /** Whether field has been modified */
  dirty: boolean;
}

// ============================================================================
// Form Controller (Framework-Agnostic)
// ============================================================================

/**
 * Create a form controller for managing form state and validation
 *
 * @example
 * ```ts
 * const form = createForm(UserSchema, {
 *   initialValues: { email: '', name: '' },
 *   onSubmit: async (values) => {
 *     await api.createUser(values);
 *   },
 * });
 *
 * // In your UI:
 * const emailProps = form.getFieldProps('email');
 * // { name, value, onChange, onBlur, error, ... }
 * ```
 */
export function createForm<S extends SchemaBuilder<Record<string, unknown>>>(
  schema: S,
  options: FormOptions<InferInput<S>> = {}
): FormController<InferInput<S>> {
  return new FormController(
    schema as unknown as SchemaBuilder<InferInput<S>>,
    options
  );
}

export class FormController<T extends Record<string, unknown>> {
  private schema: SchemaBuilder<T>;
  private options: FormOptions<T>;
  private state: FormState<T>;
  private listeners: Set<() => void> = new Set();
  private initialValues: T;

  constructor(schema: SchemaBuilder<T>, options: FormOptions<T> = {}) {
    this.schema = schema;
    this.options = {
      validateOnChange: true,
      validateOnBlur: true,
      ...options,
    };

    // Build initial values from schema defaults and provided values
    this.initialValues = this.buildInitialValues();

    this.state = {
      values: { ...this.initialValues },
      errors: {},
      warnings: {},
      touched: new Set(),
      dirty: new Set(),
      isSubmitting: false,
      isSubmitted: false,
      isValid: true,
    };
  }

  private buildInitialValues(): T {
    const values: Record<string, unknown> = {};
    const schemaFields = this.schema.definition.fields;

    for (const [fieldName, fieldDef] of Object.entries(schemaFields)) {
      if (this.options.initialValues?.[fieldName as keyof T] !== undefined) {
        values[fieldName] = this.options.initialValues[fieldName as keyof T];
      } else if (fieldDef.defaultValue !== undefined) {
        values[fieldName] = fieldDef.defaultValue;
      } else {
        // Set appropriate empty value based on type
        switch (fieldDef.type) {
          case 'string':
            values[fieldName] = '';
            break;
          case 'number':
            values[fieldName] = undefined;
            break;
          case 'boolean':
            values[fieldName] = false;
            break;
          case 'array':
            values[fieldName] = [];
            break;
          case 'object':
            values[fieldName] = {};
            break;
          default:
            values[fieldName] = undefined;
        }
      }
    }

    return values as T;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Get current form state
   */
  getState(): FormState<T> {
    return { ...this.state };
  }

  /**
   * Get current form values
   */
  getValues(): T {
    return { ...this.state.values };
  }

  /**
   * Set a field value
   */
  setFieldValue(field: keyof T, value: unknown): void {
    this.state.values = {
      ...this.state.values,
      [field]: value,
    };
    this.state.dirty.add(field as string);

    if (this.options.validateOnChange) {
      this.validateField(field as string);
    }

    this.notify();
  }

  /**
   * Set multiple values at once
   */
  setValues(values: Partial<T>): void {
    this.state.values = {
      ...this.state.values,
      ...values,
    };

    for (const key of Object.keys(values)) {
      this.state.dirty.add(key);
    }

    if (this.options.validateOnChange) {
      this.validate();
    }

    this.notify();
  }

  /**
   * Mark a field as touched (blurred)
   */
  touchField(field: string): void {
    this.state.touched.add(field);

    if (this.options.validateOnBlur) {
      this.validateField(field);
    }

    this.notify();
  }

  /**
   * Validate a single field
   */
  validateField(field: string): ValidationResult {
    const result = validate(this.schema.definition, this.state.values as Record<string, unknown>);

    // Extract errors for this field
    const fieldHardErrors = result.hardErrors.filter((e) => e.field === field);
    const fieldSoftErrors = result.softErrors.filter((e) => e.field === field);

    this.state.errors[field] = fieldHardErrors;
    this.state.warnings[field] = fieldSoftErrors;
    this.state.isValid = result.valid;

    this.notify();

    return {
      valid: fieldHardErrors.length === 0,
      hardErrors: fieldHardErrors,
      softErrors: fieldSoftErrors,
    };
  }

  /**
   * Validate entire form
   */
  validate(): ValidationResult {
    const result = validate(this.schema.definition, this.state.values as Record<string, unknown>);

    // Group errors by field
    const errors: Record<string, ValidationError[]> = {};
    const warnings: Record<string, ValidationError[]> = {};

    for (const error of result.hardErrors) {
      if (!errors[error.field]) {
        errors[error.field] = [];
      }
      errors[error.field]!.push(error);
    }

    for (const warning of result.softErrors) {
      if (!warnings[warning.field]) {
        warnings[warning.field] = [];
      }
      warnings[warning.field]!.push(warning);
    }

    this.state.errors = errors;
    this.state.warnings = warnings;
    this.state.isValid = result.valid;

    this.notify();

    return result;
  }

  /**
   * Get field props for binding to UI
   */
  getFieldProps(field: keyof T): FieldProps {
    const fieldErrors = this.state.errors[field as string] || [];
    const fieldWarnings = this.state.warnings[field as string] || [];

    return {
      name: field as string,
      value: this.state.values[field],
      onChange: (value: unknown) => this.setFieldValue(field, value),
      onBlur: () => this.touchField(field as string),
      hasError: fieldErrors.length > 0,
      error: fieldErrors[0]?.message,
      errors: fieldErrors.map((e) => e.message),
      hasWarning: fieldWarnings.length > 0,
      warning: fieldWarnings[0]?.message,
      warnings: fieldWarnings.map((w) => w.message),
      touched: this.state.touched.has(field as string),
      dirty: this.state.dirty.has(field as string),
    };
  }

  /**
   * Get all field props
   */
  getAllFieldProps(): Record<keyof T, FieldProps> {
    const props: Record<string, FieldProps> = {};
    for (const field of Object.keys(this.schema.definition.fields)) {
      props[field] = this.getFieldProps(field as keyof T);
    }
    return props as Record<keyof T, FieldProps>;
  }

  /**
   * Set field error manually (e.g., from server)
   */
  setFieldError(field: keyof T, message: string): void {
    const error: ValidationError = {
      field: field as string,
      code: 'SERVER_ERROR',
      message,
      severity: 'hard',
    };

    if (!this.state.errors[field as string]) {
      this.state.errors[field as string] = [];
    }
    this.state.errors[field as string]!.push(error);
    this.state.isValid = false;

    this.notify();
  }

  /**
   * Set multiple errors from server response
   */
  setServerErrors(errors: ValidationError[]): void {
    for (const error of errors) {
      if (!this.state.errors[error.field]) {
        this.state.errors[error.field] = [];
      }

      if (error.severity === 'soft') {
        if (!this.state.warnings[error.field]) {
          this.state.warnings[error.field] = [];
        }
        this.state.warnings[error.field]!.push(error);
      } else {
        this.state.errors[error.field]!.push(error);
      }
    }

    this.state.isValid = errors.filter((e) => e.severity === 'hard').length === 0;
    this.notify();
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.state.errors = {};
    this.state.warnings = {};
    this.state.isValid = true;
    this.notify();
  }

  /**
   * Reset form to initial values
   */
  reset(): void {
    this.state = {
      values: { ...this.initialValues },
      errors: {},
      warnings: {},
      touched: new Set(),
      dirty: new Set(),
      isSubmitting: false,
      isSubmitted: false,
      isValid: true,
    };
    this.notify();
  }

  /**
   * Handle form submission
   */
  async handleSubmit(): Promise<ValidationResult> {
    // Mark all fields as touched
    for (const field of Object.keys(this.schema.definition.fields)) {
      this.state.touched.add(field);
    }

    // Validate
    const result = this.validate();

    if (!result.valid) {
      this.options.onValidationError?.(result);
      return result;
    }

    // Submit
    if (this.options.onSubmit) {
      this.state.isSubmitting = true;
      this.notify();

      try {
        const helpers: FormHelpers<T> = {
          reset: () => this.reset(),
          setSubmitting: (isSubmitting) => {
            this.state.isSubmitting = isSubmitting;
            this.notify();
          },
          setFieldValue: (field, value) => this.setFieldValue(field, value),
          setFieldError: (field, error) => this.setFieldError(field, error),
          clearErrors: () => this.clearErrors(),
          setServerErrors: (errors) => this.setServerErrors(errors),
        };

        await this.options.onSubmit(this.state.values, helpers);
      } finally {
        this.state.isSubmitting = false;
        this.state.isSubmitted = true;
        this.notify();
      }
    }

    return result;
  }

  /**
   * Create a submit handler (for form onSubmit)
   */
  createSubmitHandler(): (e?: { preventDefault?: () => void }) => Promise<ValidationResult> {
    return async (e) => {
      e?.preventDefault?.();
      return this.handleSubmit();
    };
  }
}
