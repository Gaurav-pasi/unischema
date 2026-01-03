import { schema, field } from 'unischema';

// Test Case 1: Basic User Registration Schema
export const UserRegistrationSchema = schema({
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
});

// Test Case 2: Complex Nested Object Schema
export const ProfileSchema = schema({
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
});

// Test Case 3: E-commerce Transaction Schema (Hard + Soft Validation)
export const TransactionSchema = schema({
  amount: field.number()
    .min(0.01, 'Amount must be positive')
    .max(999999.99, 'Amount exceeds maximum limit')
    .maxSoft(10000, 'Large transaction - requires additional verification')
    .required('Amount is required'),

  currency: field.string()
    .enum(['USD', 'EUR', 'GBP', 'JPY'], 'Invalid currency')
    .required('Currency is required'),

  items: field.array(field.object(schema({
    productId: field.string().required('Product ID is required'),
    quantity: field.number()
      .min(1, 'Quantity must be at least 1')
      .max(100, 'Maximum quantity is 100')
      .integer('Quantity must be a whole number')
      .required(),
    price: field.number()
      .min(0, 'Price cannot be negative')
      .required('Price is required')
  })))
    .min(1, 'At least one item is required')
    .max(50, 'Maximum 50 items per transaction')
    .required(),

  shippingDate: field.date()
    .future('Shipping date must be in the future')
    .required('Shipping date is required'),

  notes: field.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
});

// Test Case 4: Edge Cases Schema
export const EdgeCasesSchema = schema({
  // Empty string validation
  requiredString: field.string()
    .min(1, 'Cannot be empty')
    .required('This field is required'),

  // Optional field with validation
  optionalEmail: field.string()
    .email('Must be valid email if provided')
    .optional(),

  // Number edge cases
  positiveOnly: field.number()
    .positive('Must be positive')
    .required(),

  negativeOnly: field.number()
    .negative('Must be negative')
    .required(),

  integerOnly: field.number()
    .integer('Must be a whole number')
    .required(),

  // Array edge cases
  uniqueArray: field.array(field.string())
    .unique('All items must be unique')
    .min(2, 'At least 2 items required')
    .required(),

  exactLength: field.array(field.string())
    .length(3, 'Must have exactly 3 items')
    .required(),

  // Date edge cases
  pastDate: field.date()
    .past('Date must be in the past')
    .required(),

  dateRange: field.date()
    .after(new Date('2020-01-01'), 'Date must be after Jan 1, 2020')
    .before(new Date('2030-12-31'), 'Date must be before Dec 31, 2030')
    .required(),

  // Boolean edge cases
  mustBeTrue: field.boolean()
    .isTrue('Must be true')
    .required(),

  mustBeFalse: field.boolean()
    .isFalse('Must be false')
    .required()
});

// Test Case 5: URL and Pattern Validation
export const URLSchema = schema({
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
    .ipAddress('Must be a valid IP address')
    .required()
});

// Test Case 6: Soft Validation Showcase
export const SoftValidationSchema = schema({
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
});
