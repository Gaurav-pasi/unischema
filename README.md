# Unischema

**The Universal Schema-Driven Validation Library**

[![npm version](https://badge.fury.io/js/unischema.svg)](https://www.npmjs.com/package/unischema)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Unischema is a TypeScript-first validation library that provides **one schema, everywhere**. Define your validation once, use it on frontend, backend, and get automatic TypeScript types.

## 🚀 Why Unischema?

**The Problem:**
- Frontend has validation (Yup, Zod, vee-validate)
- Backend has validation (Joi, AJV, class-validator)
- They drift apart → bugs
- No type safety between them
- Code duplication everywhere

**The Solution:**
```typescript
// ✅ Define once
const UserSchema = schema({
  email: field.string().email().required(),
  age: field.number().min(18)
});

// ✅ Use on backend (Express)
app.post('/users', validateBody(UserSchema), handler);

// ✅ Use on frontend (any framework)
const form = createForm(UserSchema, { onSubmit });

// ✅ Get TypeScript types automatically
type User = InferInput<typeof UserSchema>;
```

## 📦 Installation

```bash
npm install unischema
```

## ⚡ Quick Start

### 1️⃣ Define Your Schema

```typescript
import { schema, field } from 'unischema';

export const UserSchema = schema({
  email: field.string()
    .email('Invalid email')
    .required('Email is required'),

  password: field.string()
    .min(8, 'At least 8 characters')
    .required(),

  age: field.number()
    .min(18, 'Must be 18+')
    .max(120),
});
```

### 2️⃣ Use on Backend

```typescript
import express from 'express';
import { validateBody } from 'unischema/backend';
import { UserSchema } from './schemas';

const app = express();

app.post('/register', validateBody(UserSchema), (req, res) => {
  const { email, password, age } = req.validatedData; // ✅ Typed & validated
  res.json({ success: true });
});
```

### 3️⃣ Use on Frontend

```typescript
import { createForm } from 'unischema/frontend';
import { UserSchema } from './schemas';

const form = createForm(UserSchema, {
  onSubmit: async (values) => {
    await fetch('/register', {
      method: 'POST',
      body: JSON.stringify(values)
    });
  }
});

// Get field props for your UI framework
const emailProps = form.getFieldProps('email');
```

## 🎯 Features

- ✅ **53+ Built-in Validators** - Email, URL, IPv4/IPv6, phone, coordinates, and more
- ✅ **Async Validation** - Database checks, API validation with debouncing
- ✅ **Data Transformation** - Transform & coerce values before validation
- ✅ **Advanced Schema Composition** - deepPartial, passthrough, strict, catchall
- ✅ **Isomorphic** - Same code runs in browser and Node.js
- ✅ **TypeScript First** - Automatic type inference
- ✅ **Hard & Soft Validation** - Errors vs warnings for enterprise apps
- ✅ **Nullable/Nullish Support** - Proper null/undefined handling
- ✅ **Tree-Shakeable** - Only bundle what you use (~2KB min+gzip)
- ✅ **Framework Agnostic** - Works with React, Vue, Svelte, Angular, etc.
- ✅ **Zero Dependencies** - Lightweight and fast

## 🆕 What's New in v1.2.0 - Production Ready!

Phase 1 is complete! Unischema now includes powerful features for production applications:

### Async Validation

Validate against external APIs, databases, or async operations with built-in debouncing:

```typescript
const UserSchema = schema({
  email: field.string()
    .email()
    .refineAsync(async (email) => {
      const exists = await checkEmailExists(email);
      return !exists || { message: 'Email already registered' };
    }, { debounce: 500, timeout: 5000 }),

  username: field.string()
    .refineAsync(async (name) => {
      const available = await api.checkUsername(name);
      return available;
    }, { debounce: 300, message: 'Username taken' })
});

// Use async validation
const result = await validateAsync(UserSchema.definition, data);
```

### Data Transformation & Coercion

Transform and coerce values before validation:

```typescript
// Transform strings
const LoginSchema = schema({
  email: field.string()
    .transform(s => s.trim())
    .transform(s => s.toLowerCase())
    .email(),

  name: field.string()
    .transform(s => s.trim())
    .transform(s => s.replace(/\s+/g, ' '))  // Normalize whitespace
});

// Type coercion from form inputs
const FormSchema = schema({
  age: coerce.number().min(18),          // "25" → 25
  active: coerce.boolean(),              // "true" → true
  startDate: coerce.date(),              // "2024-01-01" → Date
  tags: coerce.array(field.string()),    // "javascript" → ["javascript"]
});

// Preprocessing for nullable values
const ProfileSchema = schema({
  bio: field.string()
    .preprocess(s => s?.trim())  // Handle null/undefined safely
    .nullable()
});
```

### Advanced Schema Composition

More flexible schema manipulation:

```typescript
const BaseSchema = schema({
  id: field.string(),
  name: field.string().required(),
  email: field.string().email().required(),
});

// Deep partial - make all fields optional recursively
const PartialSchema = deepPartial(BaseSchema);

// Passthrough - allow unknown keys
const FlexibleSchema = passthrough(BaseSchema);

// Strict mode - reject unknown keys
const StrictSchema = strict(BaseSchema);

// Catchall - handle unknown keys with validation
const CatchAllSchema = catchall(BaseSchema, field.string());

// Make specific fields required/optional
const RequiredFields = required(BaseSchema, ['name', 'email']);
const OptionalFields = optional(BaseSchema, ['email']);
```

### Nullable & Nullish Handling

Better null/undefined value handling:

```typescript
const UserSchema = schema({
  // Allow null
  middleName: field.string().nullable(),  // string | null

  // Allow null or undefined
  bio: field.string().nullish(),          // string | null | undefined

  // Required but nullable
  avatar: field.string().nullable().required(),
});
```

### Enhanced Error Context

Get detailed error information:

```typescript
const result = validate(schema({ age: field.number().min(18) }), { age: 15 });

result.hardErrors[0];
// {
//   field: "age",
//   code: "MIN_VALUE",
//   message: "Value must be at least 18",
//   severity: "hard",
//   received: 15,     // ✨ The actual value
//   expected: { min: 18 }  // ✨ The constraint that failed
//   path: ["age"]     // ✨ Path as array
// }
```

## 📚 All Validators (v1.2.0)

### String Validators (17)

```typescript
field.string()
  // Basic
  .required()                           // Required field
  .min(5)                              // Min length
  .max(100)                            // Max length
  .length(10)                          // Exact length

  // Format validation
  .email()                             // Valid email
  .url()                               // Valid URL
  .ipAddress()                         // IPv4 (validates 0-255)
  .ipv6()                              // IPv6 address

  // Character validation
  .alpha()                             // Only letters (a-zA-Z)
  .alphanumeric()                      // Letters + numbers
  .numeric()                           // Only digits
  .lowercase()                         // Must be lowercase
  .uppercase()                         // Must be UPPERCASE

  // Pattern validation
  .slug()                              // URL-friendly slug
  .hex()                               // Hexadecimal
  .base64()                            // Base64 encoded
  .json()                              // Valid JSON string
  .pattern(/regex/)                    // Custom regex

  // Content validation
  .contains('substring')               // Must contain text
  .startsWith('prefix')                // Must start with
  .endsWith('suffix')                  // Must end with
```

**Examples:**
```typescript
// Email with custom message
email: field.string().email('Please enter a valid email')

// Alphanumeric username
username: field.string()
  .alphanumeric('Only letters and numbers')
  .min(3)
  .max(20)

// URL slug
slug: field.string()
  .slug('Must be URL-friendly')
  .lowercase()

// Hex color
color: field.string()
  .hex('Invalid color code')
  .length(6)
```

### Number Validators (11)

```typescript
field.number()
  // Range validation
  .min(0)                              // Minimum value
  .max(100)                            // Maximum value
  .between(10, 20)                     // Between range

  // Type validation
  .integer()                           // Must be integer
  .positive()                          // Must be > 0
  .negative()                          // Must be < 0
  .even()                              // Even number
  .odd()                               // Odd number
  .safe()                              // Safe integer
  .finite()                            // Not Infinity/NaN

  // Special formats
  .port()                              // Port (0-65535)
  .latitude()                          // Latitude (-90 to 90)
  .longitude()                         // Longitude (-180 to 180)
  .percentage()                        // Percentage (0-100)

  // Mathematical
  .divisibleBy(5)                      // Divisible by N
  .multipleOf(3)                       // Multiple of N
```

**Examples:**
```typescript
// Port number
port: field.number()
  .port('Invalid port number')

// GPS coordinates
location: schema({
  latitude: field.number().latitude(),
  longitude: field.number().longitude()
})

// Age with soft warning
age: field.number()
  .min(13, 'Must be 13+')              // Hard error
  .minSoft(18, 'Parental consent')     // Soft warning

// Even page count
pages: field.number()
  .integer()
  .even('Must be even number')
```

### Date Validators (10)

```typescript
field.date()
  // Basic
  .after(date)                         // After date
  .before(date)                        // Before date
  .past()                              // Must be in past
  .future()                            // Must be in future

  // Relative validation
  .today()                             // Must be today
  .yesterday()                         // Must be yesterday
  .tomorrow()                          // Must be tomorrow
  .thisWeek()                          // This week
  .thisMonth()                         // This month
  .thisYear()                          // This year

  // Day validation
  .weekday()                           // Monday-Friday
  .weekend()                           // Saturday-Sunday

  // Age validation
  .age(min, max)                       // Age range from birthdate
  .between(start, end)                 // Between two dates
```

**Examples:**
```typescript
// Birth date (18-65 years old)
birthDate: field.date()
  .age(18, 65, 'Must be 18-65 years old')
  .past('Cannot be in future')

// Event must be in future
eventDate: field.date()
  .future('Event must be scheduled ahead')
  .weekday('Events only on weekdays')

// Today's attendance
checkIn: field.date()
  .today('Must check in today')
```

### Array Validators (6)

```typescript
field.array()
  // Size validation
  .min(2)                              // Min items
  .max(10)                             // Max items
  .unique()                            // All items unique

  // Content validation
  .includes(item)                      // Must include item
  .excludes(item)                      // Must not include item
  .notEmpty()                          // At least 1 item
  .empty()                             // Must be empty

  // Order validation
  .sorted('asc')                       // Sorted ascending
  .sorted('desc')                      // Sorted descending

  // Quality validation
  .compact()                           // No falsy values
```

**Examples:**
```typescript
// Tags (1-5 unique items)
tags: field.array(field.string())
  .min(1, 'At least one tag')
  .max(5, 'Max 5 tags')
  .unique('Tags must be unique')

// Must include required item
permissions: field.array()
  .includes('read', 'Read permission required')

// Sorted numbers
scores: field.array(field.number())
  .sorted('desc', 'Must be sorted highest first')
```

### Boolean Validators

```typescript
field.boolean()
  .isTrue()                            // Must be true
  .isFalse()                           // Must be false
```

**Examples:**
```typescript
// Terms acceptance
acceptTerms: field.boolean()
  .isTrue('You must accept terms')
  .required()

// Optional newsletter
newsletter: field.boolean()
  .optional()
```

### Object Validators (Nested)

```typescript
field.object(schema)                   // Nested schema validation
```

**Examples:**
```typescript
// Nested address
const AddressSchema = schema({
  street: field.string().required(),
  city: field.string().required(),
  zipCode: field.string().pattern(/^\d{5}$/)
});

const UserSchema = schema({
  name: field.string().required(),
  address: field.object(AddressSchema).required()
});
```

### Cross-Field Validators (5)

```typescript
field.string()
  .matches('password')                 // Must match field
  .notMatches('oldPassword')           // Must NOT match field

field.number()
  .greaterThan('minValue')             // > another field
  .lessThan('maxValue')                // < another field

field.string()
  .dependsOn('country')                // Required if field exists
```

**Examples:**
```typescript
// Password confirmation
const schema = schema({
  password: field.string().min(8),
  confirmPassword: field.string()
    .matches('password', 'Passwords must match')
});

// New password must differ
const changePasswordSchema = schema({
  currentPassword: field.string(),
  newPassword: field.string()
    .notMatches('currentPassword', 'Must be different')
});

// Range validation
const rangeSchema = schema({
  minPrice: field.number(),
  maxPrice: field.number()
    .greaterThan('minPrice', 'Max must be > min')
});

// Conditional requirement
const locationSchema = schema({
  country: field.string(),
  state: field.string()
    .dependsOn('country', 'State requires country')
});
```

## 💡 Hard vs Soft Validation

Unischema supports two-tier validation for enterprise applications:

```typescript
const TransactionSchema = schema({
  amount: field.number()
    .min(0.01, 'Amount must be positive')        // ❌ Hard: blocks submission
    .maxSoft(10000, 'Review required for $10k+') // ⚠️ Soft: warning only
});

const result = validateSchema(TransactionSchema.definition, { amount: 15000 });

console.log(result.valid);        // true (no hard errors)
console.log(result.hardErrors);   // []
console.log(result.softErrors);   // [{ field: 'amount', message: 'Review required...', severity: 'soft' }]
```

**Use cases:**
- Warnings that don't block submission
- Age warnings (13+ required, 18+ recommended)
- Security score suggestions
- Large transaction reviews

## 🔧 Advanced Usage

### Schema Composition

```typescript
// Extend schemas
const BaseUser = schema({
  email: field.string().email(),
  name: field.string()
});

const AdminUser = extend(BaseUser, {
  role: field.string().enum(['admin', 'superadmin']),
  permissions: field.array(field.string())
});

// Pick specific fields
const LoginSchema = pick(BaseUser, ['email']);

// Omit fields
const PublicUser = omit(BaseUser, ['password']);

// Merge schemas
const FullSchema = merge(ProfileSchema, SettingsSchema);
```

### TypeScript Integration

```typescript
import { type InferInput, type InferOutput } from 'unischema';

const UserSchema = schema({
  email: field.string().email().required(),
  age: field.number().min(0)
});

// Input type (what you pass in)
type UserInput = InferInput<typeof UserSchema>;
// { email: string; age: number }

// Output type (after validation)
type UserOutput = InferOutput<typeof UserSchema>;
```

### Custom Validation

```typescript
const schema = schema({
  password: field.string()
    .custom((value, context) => {
      if (!/[A-Z]/.test(value)) {
        return { valid: false, message: 'Need uppercase letter' };
      }
      return true;
    })
});
```

### Granular Imports (Tree-Shaking)

```typescript
// Import only what you need
import { emailValidator } from 'unischema/validators/string';
import { portValidator } from 'unischema/validators/number';
import { todayValidator } from 'unischema/validators/date';

// Or import by category
import * as stringValidators from 'unischema/validators/string';
import * as numberValidators from 'unischema/validators/number';
```

## 🌐 Framework Examples

### React

```tsx
import { createForm } from 'unischema/frontend';
import { UserSchema } from './schemas';

function RegisterForm() {
  const form = createForm(UserSchema, {
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      await api.register(values);
    }
  });

  const emailProps = form.getFieldProps('email');

  return (
    <form onSubmit={form.handleSubmit}>
      <input {...emailProps} />
      {emailProps.hasError && <span>{emailProps.error}</span>}

      <button type="submit">Register</button>
    </form>
  );
}
```

### Vue

```vue
<script setup>
import { createForm } from 'unischema/frontend';
import { UserSchema } from './schemas';

const form = createForm(UserSchema, {
  onSubmit: async (values) => {
    await api.register(values);
  }
});

const emailProps = form.getFieldProps('email');
</script>

<template>
  <form @submit.prevent="form.handleSubmit">
    <input v-bind="emailProps" />
    <span v-if="emailProps.hasError">{{ emailProps.error }}</span>
  </form>
</template>
```

### Express.js

```typescript
import express from 'express';
import { validateBody, validateQuery, validateParams } from 'unischema/backend';

const app = express();

// Body validation
app.post('/users', validateBody(UserSchema), (req, res) => {
  const user = req.validatedData; // ✅ Typed and validated
  res.json(user);
});

// Query validation
app.get('/search', validateQuery(SearchSchema), (req, res) => {
  const { query } = req.validatedData;
  res.json(results);
});

// Params validation
app.get('/users/:id', validateParams(IdSchema), (req, res) => {
  const { id } = req.validatedData;
  res.json(user);
});
```

## 📊 Real-World Examples

### User Registration

```typescript
const RegisterSchema = schema({
  email: field.string()
    .email('Invalid email address')
    .required('Email is required'),

  username: field.string()
    .alphanumeric('Only letters and numbers')
    .min(3, 'At least 3 characters')
    .max(20, 'Max 20 characters')
    .required(),

  password: field.string()
    .min(8, 'At least 8 characters')
    .pattern(/[A-Z]/, 'Need uppercase letter')
    .pattern(/[0-9]/, 'Need a number')
    .required(),

  confirmPassword: field.string()
    .matches('password', 'Passwords must match')
    .required(),

  age: field.number()
    .min(13, 'Must be 13+')
    .minSoft(18, 'Parental consent required under 18')
    .max(120, 'Invalid age')
    .integer()
    .required(),

  acceptTerms: field.boolean()
    .isTrue('You must accept the terms')
    .required()
});
```

### E-Commerce Order

```typescript
const OrderSchema = schema({
  customerId: field.string()
    .alphanumeric()
    .length(10)
    .required(),

  items: field.array(field.object(schema({
    productId: field.string().required(),
    quantity: field.number().min(1).integer(),
    price: field.number().positive()
  })))
    .min(1, 'At least one item required')
    .max(50, 'Maximum 50 items per order'),

  total: field.number()
    .positive()
    .required(),

  shippingAddress: field.object(schema({
    street: field.string().required(),
    city: field.string().required(),
    state: field.string().uppercase().length(2),
    zipCode: field.string().pattern(/^\d{5}$/)
  })).required(),

  shippingDate: field.date()
    .future('Must be a future date')
    .weekday('No weekend shipping')
});
```

### API Configuration

```typescript
const ServerConfigSchema = schema({
  host: field.string()
    .ipAddress('Invalid IP address')
    .required(),

  port: field.number()
    .port('Invalid port number')
    .required(),

  ssl: field.boolean()
    .required(),

  maxConnections: field.number()
    .integer()
    .positive()
    .between(1, 10000),

  timeout: field.number()
    .integer()
    .positive()
    .multipleOf(1000, 'Must be in seconds (1000ms)')
});
```

## 🚀 Migration Guide

### From Yup

```typescript
// Yup
const schema = yup.object({
  email: yup.string().email().required(),
  age: yup.number().min(18)
});

// Unischema
const schema = schema({
  email: field.string().email().required(),
  age: field.number().min(18)
});
```

### From Zod

```typescript
// Zod
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

// Unischema
const schema = schema({
  email: field.string().email(),
  age: field.number().min(18)
});
```

## 🎨 Bundle Size

Unischema is optimized for tree-shaking:

- **Full library**: ~15KB min+gzip
- **Core only**: ~5KB min+gzip
- **Single validator**: ~2KB min+gzip

Import only what you use for minimal bundle size.

## 📖 API Reference

### Core Functions

```typescript
import {
  // Schema creation
  schema,           // Create schema
  field,            // Field builders
  coerce,           // Type coercion builders

  // Sync validation
  validate,         // Validate data
  validateSchema,   // Validate with schema
  isValid,          // Boolean validation
  assertValid,      // Throws if invalid

  // Async validation (v1.2.0)
  validateAsync,    // Async validate data
  validateSchemaAsync, // Async validate with schema
  isValidAsync,     // Async boolean validation
  assertValidAsync, // Async throws if invalid

  // Schema composition
  extend,           // Extend schema
  pick,             // Pick fields
  omit,             // Omit fields
  merge,            // Merge schemas
  partial,          // Make all optional
  deepPartial,      // Make all optional recursively (v1.2.0)
  passthrough,      // Allow unknown keys (v1.2.0)
  strict,           // Reject unknown keys (v1.2.0)
  catchall,         // Validate unknown keys (v1.2.0)
  required,         // Make specific fields required (v1.2.0)
  optional,         // Make specific fields optional (v1.2.0)

  // Type inference
  type InferInput,  // Input type
  type InferOutput  // Output type
} from 'unischema';
```

### Backend

```typescript
import {
  validateBody,     // Validate request body
  validateQuery,    // Validate query params
  validateParams,   // Validate route params
  withValidation,   // Wrapper with validation
  createHandler     // Serverless handler
} from 'unischema/backend';
```

### Frontend

```typescript
import {
  createForm,       // Create form helper
  parseApiErrors,   // Parse server errors
  focusFirstError   // Focus first error field
} from 'unischema/frontend';
```

## 🤝 Contributing

Contributions are welcome! Please check out the [GitHub repository](https://github.com/Gaurav-pasi/unischema).

## 📄 License

MIT © [Gaurav Pasi](https://github.com/Gaurav-pasi)

## 🔗 Links

- [npm package](https://www.npmjs.com/package/unischema)
- [GitHub repository](https://github.com/Gaurav-pasi/unischema)
- [Issue tracker](https://github.com/Gaurav-pasi/unischema/issues)

---

**Made with ❤️ for developers who value type safety and code reusability**
