/**
 * Frontend adapter exports
 */

// Form controller
export {
  createForm,
  FormController,
  type FormState,
  type FormOptions,
  type FormHelpers,
  type FieldProps,
} from './form';

// Utility functions
export {
  getFieldError,
  getFieldErrors,
  getFieldWarning,
  getFieldWarnings,
  hasFieldError,
  hasFieldWarning,
  groupErrorsByField,
  toErrorMap,
  toWarningsMap,
  parseApiErrors,
  debounceValidation,
  getFirstErrorField,
  focusFirstError,
  coerceValue,
} from './utils';
