/**
 * Frontend Form Example
 *
 * This demonstrates how to use FormSchema on the frontend.
 * The same schemas are shared with the backend.
 *
 * This is framework-agnostic - adapt to React, Vue, Svelte, etc.
 */

import { createForm, parseApiErrors, focusFirstError } from '../../src/adapters/frontend';
import {
  UserRegistrationSchema,
  TransactionSchema,
  type UserRegistrationInput,
  type TransactionInput,
} from '../shared-schemas';

// ============================================================================
// Example 1: Basic Form Usage
// ============================================================================

export function createRegistrationForm() {
  const form = createForm(UserRegistrationSchema, {
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      age: undefined as unknown as number,
      acceptTerms: false,
    },

    validateOnChange: true,
    validateOnBlur: true,

    onSubmit: async (values, helpers) => {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          // Parse server errors and display them
          const serverResult = parseApiErrors(data);
          helpers.setServerErrors(serverResult.hardErrors);
          helpers.setServerErrors(serverResult.softErrors);
          return;
        }

        // Success - reset form or redirect
        console.log('Registration successful:', data);
        helpers.reset();

      } catch (error) {
        console.error('Registration failed:', error);
        helpers.setFieldError('email', 'Registration failed. Please try again.');
      }
    },

    onValidationError: (result) => {
      // Focus the first field with an error
      focusFirstError(result, { scrollIntoView: true });
    },
  });

  return form;
}

// ============================================================================
// Example 2: Using Form in Vanilla JS
// ============================================================================

export function setupVanillaJSForm() {
  const form = createRegistrationForm();

  // Get all field props for binding
  const fields = form.getAllFieldProps();

  // Example: Bind to a text input
  const emailInput = document.getElementById('email') as HTMLInputElement;
  if (emailInput) {
    emailInput.value = fields.email.value as string;

    emailInput.addEventListener('input', (e) => {
      form.setFieldValue('email', (e.target as HTMLInputElement).value);
    });

    emailInput.addEventListener('blur', () => {
      form.touchField('email');
    });
  }

  // Update UI when state changes
  form.subscribe(() => {
    const state = form.getState();

    // Update error displays
    for (const [fieldName, fieldErrors] of Object.entries(state.errors)) {
      const errorEl = document.getElementById(`${fieldName}-error`);
      if (errorEl) {
        errorEl.textContent = fieldErrors[0]?.message || '';
        errorEl.style.display = fieldErrors.length > 0 ? 'block' : 'none';
      }
    }

    // Update warning displays
    for (const [fieldName, fieldWarnings] of Object.entries(state.warnings)) {
      const warnEl = document.getElementById(`${fieldName}-warning`);
      if (warnEl) {
        warnEl.textContent = fieldWarnings[0]?.message || '';
        warnEl.style.display = fieldWarnings.length > 0 ? 'block' : 'none';
      }
    }

    // Update submit button
    const submitBtn = document.getElementById('submit') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = state.isSubmitting;
      submitBtn.textContent = state.isSubmitting ? 'Submitting...' : 'Submit';
    }
  });

  // Handle form submission
  const formEl = document.getElementById('registration-form');
  if (formEl) {
    formEl.addEventListener('submit', form.createSubmitHandler());
  }

  return form;
}

// ============================================================================
// Example 3: React-like Usage (pseudo-code)
// ============================================================================

/*
// In a React component:

import { useEffect, useState } from 'react';
import { createForm } from 'formschema/frontend';
import { UserRegistrationSchema } from './shared-schemas';

function RegistrationForm() {
  const [form] = useState(() => createForm(UserRegistrationSchema, {
    onSubmit: async (values) => {
      await api.register(values);
    },
  }));

  const [state, setState] = useState(form.getState());

  useEffect(() => {
    return form.subscribe(() => setState(form.getState()));
  }, [form]);

  const emailProps = form.getFieldProps('email');

  return (
    <form onSubmit={form.createSubmitHandler()}>
      <input
        name={emailProps.name}
        value={emailProps.value}
        onChange={(e) => emailProps.onChange(e.target.value)}
        onBlur={emailProps.onBlur}
      />
      {emailProps.hasError && <span className="error">{emailProps.error}</span>}
      {emailProps.hasWarning && <span className="warning">{emailProps.warning}</span>}

      <button type="submit" disabled={state.isSubmitting}>
        {state.isSubmitting ? 'Submitting...' : 'Register'}
      </button>
    </form>
  );
}
*/

// ============================================================================
// Example 4: Transaction Form with Warnings
// ============================================================================

export function createTransactionForm() {
  const form = createForm(TransactionSchema, {
    initialValues: {
      amount: undefined as unknown as number,
      currency: 'USD',
      description: '',
      accountId: '',
      category: 'TRANSFER',
    },

    onSubmit: async (values: TransactionInput, helpers) => {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          const serverResult = parseApiErrors(data);
          helpers.setServerErrors([...serverResult.hardErrors, ...serverResult.softErrors]);
          return;
        }

        // Check for warnings in successful response
        if (data.validation?.soft_validations?.length > 0) {
          // Show warning dialog but don't block
          console.log('Transaction warnings:', data.validation.soft_validations);
        }

        console.log('Transaction successful:', data);

      } catch (error) {
        console.error('Transaction failed:', error);
      }
    },
  });

  return form;
}

// ============================================================================
// Example 5: Field-Level Validation
// ============================================================================

export function validateSingleField() {
  const form = createRegistrationForm();

  // Set a value
  form.setFieldValue('email', 'invalid-email');

  // Validate just this field
  const result = form.validateField('email');

  console.log('Field valid:', result.valid);
  console.log('Field errors:', result.hardErrors);

  // Get field props (includes error state)
  const emailProps = form.getFieldProps('email');
  console.log('Has error:', emailProps.hasError);
  console.log('Error message:', emailProps.error);
}

// ============================================================================
// Example 6: Manual Error Handling
// ============================================================================

export function handleServerErrors() {
  const form = createRegistrationForm();

  // Simulate server response with errors
  const serverResponse = {
    status: 'validation_error',
    errors: [
      { field: 'email', code: 'DUPLICATE', message: 'Email already exists', severity: 'hard' as const },
    ],
    validation: {
      hard_validations: [
        { field: 'email', code: 'DUPLICATE', message: 'Email already exists', severity: 'hard' as const },
      ],
      soft_validations: [],
    },
  };

  // Parse and apply server errors
  const result = parseApiErrors(serverResponse);
  form.setServerErrors([...result.hardErrors, ...result.softErrors]);

  // Now the form shows the server error
  const state = form.getState();
  console.log('Form errors:', state.errors);
}
