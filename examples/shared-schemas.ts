/**
 * Shared schemas - used by both frontend and backend
 *
 * This is the single source of truth for validation rules.
 * Import this file in both your frontend and backend code.
 */

import { schema, field, type InferInput } from '../src';

// ============================================================================
// User Registration Schema
// ============================================================================

export const UserRegistrationSchema = schema({
  email: field.string()
    .email('Please enter a valid email address')
    .required('Email is required'),

  password: field.string()
    .min(8, 'Password must be at least 8 characters')
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    )
    .required('Password is required'),

  confirmPassword: field.string()
    .matches('password', 'Passwords do not match')
    .required('Please confirm your password'),

  name: field.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .required('Name is required'),

  age: field.number()
    .min(13, 'You must be at least 13 years old')
    .minSoft(18, 'Users under 18 require parental consent')
    .integer('Age must be a whole number'),

  acceptTerms: field.boolean()
    .isTrue('You must accept the terms and conditions')
    .required(),
});

export type UserRegistrationInput = InferInput<typeof UserRegistrationSchema>;

// ============================================================================
// User Profile Update Schema
// ============================================================================

export const UserProfileSchema = schema({
  name: field.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),

  bio: field.string()
    .max(500, 'Bio must be under 500 characters')
    .maxSoft(200, 'Consider keeping your bio concise'),

  website: field.string()
    .url('Please enter a valid URL'),

  phone: field.string()
    .pattern(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'),
});

export type UserProfileInput = InferInput<typeof UserProfileSchema>;

// ============================================================================
// Transaction Schema (Enterprise Example)
// ============================================================================

export const TransactionSchema = schema({
  amount: field.number()
    .min(0.01, 'Amount must be positive')
    .max(1000000, 'Amount exceeds maximum limit')
    .maxSoft(10000, 'Large transaction - will require additional verification')
    .required('Amount is required'),

  currency: field.string()
    .enum(['USD', 'EUR', 'GBP', 'INR'] as const, 'Invalid currency')
    .required('Currency is required'),

  description: field.string()
    .max(500, 'Description too long')
    .minSoft(10, 'Consider adding more details for your records'),

  accountId: field.string()
    .pattern(/^ACC-[A-Z0-9]{8}$/, 'Invalid account ID format')
    .required('Account ID is required'),

  category: field.string()
    .enum([
      'TRANSFER',
      'PAYMENT',
      'WITHDRAWAL',
      'DEPOSIT',
      'FEE',
    ] as const)
    .required('Category is required'),
});

export type TransactionInput = InferInput<typeof TransactionSchema>;

// ============================================================================
// Contact Form Schema
// ============================================================================

export const ContactFormSchema = schema({
  name: field.string()
    .min(2, 'Name is too short')
    .required('Name is required'),

  email: field.string()
    .email('Invalid email address')
    .required('Email is required'),

  subject: field.string()
    .min(5, 'Subject is too short')
    .max(100, 'Subject is too long')
    .required('Subject is required'),

  message: field.string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message is too long')
    .required('Message is required'),

  priority: field.string()
    .enum(['low', 'normal', 'high', 'urgent'] as const)
    .default('normal'),
});

export type ContactFormInput = InferInput<typeof ContactFormSchema>;

// ============================================================================
// Address Schema (Reusable)
// ============================================================================

export const AddressSchema = schema({
  street: field.string()
    .min(5, 'Street address is too short')
    .required('Street address is required'),

  city: field.string()
    .min(2, 'City name is too short')
    .required('City is required'),

  state: field.string()
    .min(2, 'State is required')
    .required(),

  zipCode: field.string()
    .pattern(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
    .required('ZIP code is required'),

  country: field.string()
    .min(2, 'Country is required')
    .required(),
});

export type AddressInput = InferInput<typeof AddressSchema>;

// ============================================================================
// Order Schema (With Nested Objects)
// ============================================================================

const OrderItemSchema = schema({
  productId: field.string().required(),
  name: field.string().required(),
  quantity: field.number().min(1).integer().required(),
  unitPrice: field.number().min(0).required(),
});

export const OrderSchema = schema({
  customerId: field.string().required(),

  items: field.array(field.object(OrderItemSchema))
    .min(1, 'Order must have at least one item')
    .required(),

  shippingAddress: field.object(AddressSchema).required(),

  billingAddress: field.object(AddressSchema),

  notes: field.string().max(1000),

  expedited: field.boolean().default(false),
});

export type OrderInput = InferInput<typeof OrderSchema>;
