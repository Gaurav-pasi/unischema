# FormSchema

**Schema-Driven, Isomorphic Form & Validation Engine**

FormSchema is a TypeScript-first validation library that provides a single source of truth for form validation across your entire stack. Define your schema once, use it everywhere — frontend, backend, and type system.

## The Problem

In traditional applications:
- Frontend has its own validation (vee-validate, Yup, Zod)
- Backend has its own validation (Joi, AJV, class-validator)
- They often drift apart, causing bugs
- No type safety between the two
- Duplicate code, duplicate bugs

## The Solution

FormSchema provides:
- **Single executable schema** that runs unchanged in browser and Node.js
- **Automatic TypeScript types** inferred from your schema
- **Hard + Soft validation** (errors vs warnings) for enterprise patterns
- **Framework-agnostic core** with adapters for Express, serverless, and any frontend
- **Zero duplicated logic** — one schema, everywhere

## Installation

```bash
npm install formschema
```

## Quick Start

### 1. Define Your Schema (Once)

```typescript
// schemas/user.ts
import { schema, field, type InferInput } from 'formschema';

export const UserSchema = schema({
  email: field.string()
    .email('Invalid email address')
    .required('Email is required'),

  password: field.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),

  age: field.number()
    .min(13, 'Must be at least 13')           // Hard validation
    .minSoft(18, 'Parental consent required'), // Soft warning
});

// TypeScript type is automatically inferred
export type UserInput = InferInput<typeof UserSchema>;
// { email: string; password: string; age: number }
```

### 2. Use on Backend (Express)

```typescript
// server.ts
import express from 'express';
import { validateBody, type ValidatedRequest } from 'formschema/backend';
import { UserSchema, type UserInput } from './schemas/user';

const app = express();
app.use(express.json());

app.post('/api/users',
  validateBody(UserSchema),
  (req: ValidatedRequest<UserInput>, res) => {
    // req.validatedData is typed and validated!
    const { email, password, age } = req.validatedData;

    // Check for warnings
    if (req.validationResult.softErrors.length > 0) {
      console.log('Warnings:', req.validationResult.softErrors);
    }

    res.json({ success: true, email });
  }
);
```

### 3. Use on Frontend

```typescript
// form.ts
import { createForm, focusFirstError } from 'formschema/frontend';
import { UserSchema } from './schemas/user';

const form = createForm(UserSchema, {
  onSubmit: async (values) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    // Handle response...
  },
});

// Get field props for your UI
const emailProps = form.getFieldProps('email');
// { name, value, onChange, onBlur, error, hasError, ... }
```

## Core Concepts

### Hard vs Soft Validation

FormSchema supports two-tier validation, essential for enterprise applications:

```typescript
const TransactionSchema = schema({
  amount: field.number()
    .min(0.01, 'Amount must be positive')           // Hard: blocks submission
    .maxSoft(10000, 'Large transaction - review'),  // Soft: warning only
});

const result = validate(TransactionSchema.definition, { amount: 50000 });

result.valid;       // true - no hard errors
result.hardErrors;  // []
result.softErrors;  // [{ field: 'amount', message: 'Large transaction...', severity: 'soft' }]
```

**Hard validations** block form submission. **Soft validations** are warnings that don't block.

### Schema Composition

Build complex schemas from reusable parts:

```typescript
const AddressSchema = schema({
  street: field.string().required(),
  city: field.string().required(),
  zipCode: field.string().pattern(/^\d{5}$/),
});

const UserSchema = schema({
  name: field.string().required(),
  address: field.object(AddressSchema).required(),
});

// Extend schemas
const AdminSchema = extend(UserSchema, {
  role: field.string().enum(['admin', 'superadmin']),
});

// Pick/Omit fields
const PublicUserSchema = omit(UserSchema, ['password']);
const LoginSchema = pick(UserSchema, ['email', 'password']);
```

### Type Inference

Types are automatically inferred from your schema:

```typescript
const UserSchema = schema({
  email: field.string().email().required(),
  age: field.number().min(0),
  tags: field.array(field.string()),
});

type User = InferInput<typeof UserSchema>;
// {
//   email: string;
//   age: number;
//   tags: string[];
// }
```

## API Reference

### Schema Builders

#### `field.string()`

```typescript
field.string()
  .min(length, message?)       // Minimum length
  .max(length, message?)       // Maximum length
  .email(message?)             // Email format
  .url(message?)               // URL format
  .pattern(regex, message?)    // Regex pattern
  .enum(values, message?)      // Enum values
  .matches(field, message?)    // Match another field
  .required(message?)          // Mark as required
  .optional()                  // Mark as optional
  // Soft versions (warnings only)
  .minSoft(length, message?)
  .maxSoft(length, message?)
```

#### `field.number()`

```typescript
field.number()
  .min(value, message?)        // Minimum value
  .max(value, message?)        // Maximum value
  .integer(message?)           // Must be integer
  .positive(message?)          // Must be positive
  .negative(message?)          // Must be negative
  .required(message?)
  // Soft versions
  .minSoft(value, message?)    // or .warnBelow()
  .maxSoft(value, message?)    // or .warnAbove()
```

#### `field.boolean()`

```typescript
field.boolean()
  .isTrue(message?)            // Must be true
  .isFalse(message?)           // Must be false
  .required(message?)
```

#### `field.date()`

```typescript
field.date()
  .after(date, message?)       // After a date
  .before(date, message?)      // Before a date
  .past(message?)              // Must be in past
  .future(message?)            // Must be in future
  .required(message?)
```

#### `field.array(itemBuilder?)`

```typescript
field.array(field.string())
  .min(count, message?)        // Minimum items
  .max(count, message?)        // Maximum items
  .length(count, message?)     // Exact count
  .unique(message?)            // All items unique
  .required(message?)
```

#### `field.object(schema)`

```typescript
field.object(AddressSchema)
  .required(message?)
```

### Validation Functions

```typescript
import { validate, isValid, assertValid } from 'formschema';

// Returns ValidationResult
const result = validate(schema.definition, data);
// { valid: boolean, hardErrors: [], softErrors: [] }

// Returns boolean
const valid = isValid(schema.definition, data);

// Throws if invalid
const data = assertValid(schema.definition, input);
```

### Backend Adapters

```typescript
import {
  validateBody,
  validateQuery,
  validateParams,
  withValidation,
  createHandler,
} from 'formschema/backend';

// Express middleware
app.post('/users', validateBody(UserSchema), handler);
app.get('/users', validateQuery(QuerySchema), handler);
app.get('/users/:id', validateParams(ParamsSchema), handler);

// Wrapper with typed handler
app.post('/users', ...withValidation(UserSchema, async (req, res) => {
  const data = req.validatedData; // Typed!
}));

// Serverless handler
const handler = createHandler(UserSchema, async ({ data }) => {
  return { user: await createUser(data) };
});
```

### Frontend Adapters

```typescript
import { createForm, parseApiErrors, focusFirstError } from 'formschema/frontend';

const form = createForm(UserSchema, {
  initialValues: { email: '', password: '' },
  validateOnChange: true,
  validateOnBlur: true,
  onSubmit: async (values, helpers) => {
    // Submit logic
  },
});

// Form methods
form.setFieldValue('email', 'test@example.com');
form.touchField('email');
form.validate();
form.validateField('email');
form.reset();
form.handleSubmit();

// Get field props for binding
const props = form.getFieldProps('email');
// { name, value, onChange, onBlur, error, hasError, warning, hasWarning, ... }

// Handle server errors
const result = parseApiErrors(apiResponse);
form.setServerErrors(result.hardErrors);
```

## Enterprise Response Format

FormSchema uses a consistent error structure compatible with enterprise systems:

```typescript
interface EnterpriseValidationResponse {
  status: 'success' | 'validation_error';
  data?: unknown;
  errors: ValidationError[];
  msg: string;
  validation: {
    hard_validations: ValidationError[];
    soft_validations: ValidationError[];
  };
}

interface ValidationError {
  field: string;          // e.g., "email" or "address.city"
  code: string;           // e.g., "REQUIRED", "MIN_LENGTH"
  message: string;        // Human-readable message
  severity: 'hard' | 'soft';
}
```

## Incremental Adoption

FormSchema supports incremental adoption in existing systems:

```typescript
// Use only backend validation
import { validateInput } from 'formschema/backend';
const { valid, data, response } = validateInput(UserSchema, input);

// Use only type generation
import { type InferInput } from 'formschema';
type User = InferInput<typeof UserSchema>;

// Use only frontend validation
import { validate } from 'formschema';
const result = validate(UserSchema.definition, formData);
```

## License

MIT
