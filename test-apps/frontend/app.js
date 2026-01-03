// Note: This needs to be served via a module-compatible server
// For testing, use: npm install && npx http-server -p 8080

import { schema, field, validate } from '../../dist/index.mjs';

const API_BASE = 'http://localhost:3000/api';

// Statistics tracking
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

function updateStats() {
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-passed').textContent = stats.passed;
  document.getElementById('stat-failed').textContent = stats.failed;
  document.getElementById('stat-warnings').textContent = stats.warnings;
}

// Schema definitions (matching backend)
const schemas = {
  registration: schema({
    email: field.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: field.string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password too long')
      .required('Password is required'),
    confirmPassword: field.string()
      .matches('password', 'Passwords must match')
      .required('Please confirm password'),
    age: field.number()
      .min(13, 'Must be at least 13 years old')
      .minSoft(18, 'Parental consent required for users under 18')
      .max(150, 'Invalid age')
      .required('Age is required'),
    username: field.string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be less than 20 characters')
      .pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .required('Username is required'),
    acceptTerms: field.boolean()
      .isTrue('You must accept the terms and conditions')
      .required('Terms acceptance is required')
  }),

  profile: schema({
    firstName: field.string()
      .min(1, 'First name is required')
      .max(50, 'First name too long')
      .required(),
    lastName: field.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name too long')
      .required(),
    address: field.object(schema({
      street: field.string().required('Street is required'),
      city: field.string().required('City is required'),
      state: field.string()
        .min(2, 'State code must be 2 characters')
        .max(2, 'State code must be 2 characters')
        .pattern(/^[A-Z]{2}$/, 'State must be 2 uppercase letters')
        .required('State is required'),
      zipCode: field.string()
        .pattern(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
        .required('ZIP code is required')
    })).required('Address is required'),
    phoneNumbers: field.array(field.string().pattern(/^\d{3}-\d{3}-\d{4}$/, 'Phone must be in format XXX-XXX-XXXX'))
      .min(1, 'At least one phone number is required')
      .max(3, 'Maximum 3 phone numbers allowed')
      .required()
  }),

  transaction: schema({
    amount: field.number()
      .min(0.01, 'Amount must be positive')
      .max(999999.99, 'Amount exceeds maximum limit')
      .maxSoft(10000, 'Large transaction - requires additional verification')
      .required('Amount is required'),
    currency: field.string()
      .enum(['USD', 'EUR', 'GBP', 'JPY'], 'Invalid currency')
      .required('Currency is required'),
    shippingDate: field.date()
      .future('Shipping date must be in the future')
      .required('Shipping date is required'),
    notes: field.string()
      .max(500, 'Notes cannot exceed 500 characters')
      .optional()
  }),

  urls: schema({
    website: field.string()
      .url('Invalid URL format')
      .required('Website is required'),
    slug: field.string()
      .pattern(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
      .min(3, 'Slug too short')
      .max(50, 'Slug too long')
      .required(),
    hexColor: field.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #FF5733)')
      .required(),
    ipAddress: field.string()
      .pattern(/^(\d{1,3}\.){3}\d{1,3}$/, 'Must be a valid IP address')
      .required()
  }),

  edge: schema({
    requiredString: field.string()
      .min(1, 'Cannot be empty')
      .required('This field is required'),
    optionalEmail: field.string()
      .email('Must be valid email if provided')
      .optional(),
    positiveOnly: field.number()
      .positive('Must be positive')
      .required(),
    integerOnly: field.number()
      .integer('Must be a whole number')
      .required()
  }),

  soft: schema({
    username: field.string()
      .min(3, 'Username must be at least 3 characters')
      .minSoft(6, 'Username should be at least 6 characters for better security')
      .max(20, 'Username too long')
      .required(),
    password: field.string()
      .min(6, 'Password must be at least 6 characters')
      .minSoft(12, 'Password should be at least 12 characters for better security')
      .required(),
    age: field.number()
      .min(0, 'Age cannot be negative')
      .minSoft(18, 'User is a minor - parental consent required')
      .maxSoft(65, 'Senior citizen - special terms may apply')
      .required(),
    purchaseAmount: field.number()
      .min(0.01, 'Amount must be positive')
      .maxSoft(5000, 'Large purchase - manual review recommended')
      .required()
  })
};

// Form handler
function setupForm(formId, schemaKey, endpoint) {
  const form = document.getElementById(formId);
  const formSchema = schemas[schemaKey];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    form.querySelectorAll('.warning-message').forEach(el => el.textContent = '');
    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.classList.remove('error', 'warning');
    });

    // Get form data
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      if (key.includes('.')) {
        // Handle nested objects (e.g., "address.street")
        const parts = key.split('.');
        if (!data[parts[0]]) data[parts[0]] = {};
        data[parts[0]][parts[1]] = value;
      } else if (key.endsWith('[]')) {
        // Handle arrays
        const cleanKey = key.replace('[]', '');
        if (!data[cleanKey]) data[cleanKey] = [];
        if (value) data[cleanKey].push(value);
      } else if (form.querySelector(`[name="${key}"]`).type === 'checkbox') {
        data[key] = form.querySelector(`[name="${key}"]`).checked;
      } else if (form.querySelector(`[name="${key}"]`).type === 'number') {
        data[key] = value ? parseFloat(value) : undefined;
      } else if (form.querySelector(`[name="${key}"]`).type === 'date') {
        data[key] = value ? new Date(value).toISOString() : undefined;
      } else {
        data[key] = value || undefined;
      }
    }

    console.log('Form data:', data);

    // Validate with unischema
    const validationResult = validate(formSchema.definition, data);
    console.log('Validation result:', validationResult);

    // Display validation errors
    if (!validationResult.valid) {
      stats.total++;
      stats.failed++;
      updateStats();

      validationResult.hardErrors.forEach(error => {
        const fieldName = error.field;
        const input = form.querySelector(`[name="${fieldName}"], [name="${fieldName}."], [name="${fieldName}[]"]`);
        if (input) {
          input.classList.add('error');
          const errorDiv = input.parentElement.querySelector('.error-message');
          if (errorDiv) errorDiv.textContent = error.message;
        }
      });

      showResponse(form, 'error', 'Validation failed. Please fix the errors above.');
      return;
    }

    // Display soft validation warnings
    if (validationResult.softErrors.length > 0) {
      stats.warnings += validationResult.softErrors.length;
      updateStats();

      validationResult.softErrors.forEach(error => {
        const fieldName = error.field;
        const input = form.querySelector(`[name="${fieldName}"], [name="${fieldName}."], [name="${fieldName}[]"]`);
        if (input) {
          input.classList.add('warning');
          const warningDiv = input.parentElement.querySelector('.warning-message');
          if (warningDiv) warningDiv.textContent = error.message;
        }
      });
    }

    // Submit to backend
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        stats.total++;
        stats.passed++;
        updateStats();

        let message = result.message;
        if (result.warnings && result.warnings.length > 0) {
          message += `\n\nWarnings:\n${result.warnings.map(w => `- ${w.message}`).join('\n')}`;
        }
        if (result.securityScore !== undefined) {
          message += `\n\nSecurity Score: ${result.securityScore}/100`;
        }

        showResponse(form, result.warnings ? 'warning' : 'success', message);
      } else {
        stats.total++;
        stats.failed++;
        updateStats();

        let errorMessage = 'Server validation failed:\n';
        if (result.errors) {
          errorMessage += result.errors.map(e => `- ${e.message}`).join('\n');
        } else {
          errorMessage += result.message || 'Unknown error';
        }

        showResponse(form, 'error', errorMessage);
      }
    } catch (error) {
      stats.total++;
      stats.failed++;
      updateStats();

      showResponse(form, 'error', `Network error: ${error.message}\n\nMake sure the backend server is running on port 3000`);
    }
  });

  // Real-time validation on blur
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('blur', () => {
      const data = {};
      const formData = new FormData(form);

      for (const [key, value] of formData.entries()) {
        if (key.includes('.')) {
          const parts = key.split('.');
          if (!data[parts[0]]) data[parts[0]] = {};
          data[parts[0]][parts[1]] = value;
        } else if (key.endsWith('[]')) {
          const cleanKey = key.replace('[]', '');
          if (!data[cleanKey]) data[cleanKey] = [];
          if (value) data[cleanKey].push(value);
        } else if (input.type === 'checkbox') {
          data[key] = input.checked;
        } else if (input.type === 'number') {
          data[key] = value ? parseFloat(value) : undefined;
        } else if (input.type === 'date') {
          data[key] = value ? new Date(value).toISOString() : undefined;
        } else {
          data[key] = value || undefined;
        }
      }

      const validationResult = validate(formSchema.definition, data);

      const fieldName = input.name.replace('[]', '').replace('.', '.');
      input.classList.remove('error', 'warning');

      const errorDiv = input.parentElement.querySelector('.error-message');
      const warningDiv = input.parentElement.querySelector('.warning-message');

      if (errorDiv) errorDiv.textContent = '';
      if (warningDiv) warningDiv.textContent = '';

      const hardError = validationResult.hardErrors.find(e => e.field === fieldName || input.name.includes(e.field));
      const softError = validationResult.softErrors.find(e => e.field === fieldName || input.name.includes(e.field));

      if (hardError) {
        input.classList.add('error');
        if (errorDiv) errorDiv.textContent = hardError.message;
      } else if (softError) {
        input.classList.add('warning');
        if (warningDiv) warningDiv.textContent = softError.message;
      }
    });
  });
}

function showResponse(form, type, message) {
  const responseDiv = form.querySelector('.response');
  responseDiv.className = `response ${type}`;
  responseDiv.textContent = message;
  responseDiv.style.display = 'block';
}

// Add phone number field
window.addPhone = function() {
  const phoneList = document.getElementById('phone-list');
  const count = phoneList.children.length;

  if (count >= 3) {
    alert('Maximum 3 phone numbers allowed');
    return;
  }

  const div = document.createElement('div');
  div.className = 'array-item';
  div.innerHTML = `
    <input type="text" name="phoneNumbers[]" placeholder="555-123-4567">
    <button type="button" onclick="this.parentElement.remove()">Remove</button>
  `;
  phoneList.appendChild(div);
};

// Initialize all forms
document.addEventListener('DOMContentLoaded', () => {
  setupForm('form-registration', 'registration', 'register');
  setupForm('form-profile', 'profile', 'profile');
  setupForm('form-transaction', 'transaction', 'transaction');
  setupForm('form-urls', 'urls', 'urls');
  setupForm('form-edge', 'edge', 'edge-cases');
  setupForm('form-soft', 'soft', 'soft-validation');

  console.log('✅ Unischema Frontend Test Suite initialized');
  console.log('📊 Schemas loaded:', Object.keys(schemas));
});
