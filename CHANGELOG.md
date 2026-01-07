# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-08

### 🎉 Major Release - Phase 1 Complete: Production-Ready Features

This release completes **Phase 1** of the roadmap, making Unischema fully production-ready with enterprise-grade features.

### ✨ Added

#### **Async Validation** (Phase 1.1)
- Added `refineAsync()` method for asynchronous custom validation
  ```typescript
  field.string().email().refineAsync(async (email) => {
    const exists = await checkEmailExists(email);
    return !exists;
  }, { debounce: 500, timeout: 5000 })
  ```
- Added `refineAsyncSoft()` for async warnings
- Implemented debouncing support to prevent excessive API calls
- Added configurable timeout handling (default: 5000ms)
- Created complete async validation engine:
  - `validateAsync()` - Async validation with Promise support
  - `isValidAsync()` - Async boolean validation check
  - `assertValidAsync()` - Async validation with exception throwing
- Parallel async validation execution for better performance

#### **Data Transformation & Coercion** (Phase 1.2)
- Added `.transform()` method for value transformation pipelines
  ```typescript
  field.string()
    .transform(s => s.trim())
    .transform(s => s.toLowerCase())
  ```
- Added `.preprocess()` method for handling null/undefined values
  ```typescript
  field.string().preprocess(s => s?.trim() ?? '')
  ```
- **NEW: `field.coerce` namespace** for automatic type conversion:
  - `coerce.string()` - Converts any value to string
  - `coerce.number()` - Converts strings/booleans to numbers ("123" → 123)
  - `coerce.boolean()` - Converts "true"/"false"/1/0 to boolean
  - `coerce.date()` - Converts strings/numbers to Date objects
  - `coerce.array()` - Converts single values to arrays
  ```typescript
  field.coerce.number().positive() // "123" → 123 ✅
  field.coerce.boolean() // "true" → true ✅
  ```

#### **Schema Composition** (Phase 1.3)
- Added `.deepPartial()` - Make all fields optional recursively
  ```typescript
  const UpdateSchema = UserSchema.deepPartial()
  ```
- Added `.passthrough()` - Allow unknown keys to pass through
- Added `.strict()` - Reject unknown keys with validation errors
- Added `.catchall()` - Default handler for unknown keys
  ```typescript
  schema.catchall(field.string()) // All unknown keys must be strings
  ```
- Added `.required()` - Make specific fields required
  ```typescript
  UserSchema.required(['email', 'password'])
  ```
- Added `.optional()` - Make specific fields optional
  ```typescript
  UserSchema.optional(['phone', 'address'])
  ```
- Enhanced existing methods:
  - `.merge()` - Merge multiple schemas
  - `.extend()` - Add fields to existing schema
  - `.pick()` - Select specific fields
  - `.omit()` - Exclude specific fields
  - `.partial()` - Make all fields optional

#### **Enhanced Error Handling** (Phase 1.4)
- Enhanced `ValidationError` interface with:
  - `path` array: `["address", "city", "zipCode"]` for nested error paths
  - `received` property: Shows the actual value that failed validation
  - `expected` property: Shows expected constraints/value
  ```typescript
  {
    field: "age",
    path: ["age"],
    code: "MIN_VALUE",
    message: "Must be at least 18",
    severity: "hard",
    received: 15,
    expected: { min: 18 }
  }
  ```
- Added `ValidationOptions` for customization:
  - **`errorMap`**: Custom error message formatter
    ```typescript
    validate(schema, data, {
      errorMap: (error) => ({
        message: error.code === 'INVALID_EMAIL'
          ? 'Please enter a valid email address'
          : error.message
      })
    })
    ```
  - **`abortEarly`**: Stop validation on first error (performance optimization)
    ```typescript
    validate(schema, data, { abortEarly: true })
    ```
  - **`aggregateByField`**: Group errors by field path
    ```typescript
    const result = validate(schema, data, { aggregateByField: true });
    result.errorsByField['email'] // All email errors
    ```

#### **Nullable & Nullish Support** (Phase 1.5)
- Added `.nullable()` - Allow null values (Type: `T | null`)
  ```typescript
  field.string().nullable() // string | null
  ```
- Added `.nullish()` - Allow null or undefined (Type: `T | null | undefined`)
  ```typescript
  field.string().nullish() // string | null | undefined
  ```
- Validation engine properly handles nullable/nullish values
- Works seamlessly with transforms and coercion

### 🔧 Improved

- **Type Inference**: Better TypeScript type inference for all new features
- **Validation Engine**: Updated sync and async engines to apply preprocessing and transformations
- **Error Messages**: More detailed error context with received/expected values
- **Performance**: Optimized validation with abortEarly option
- **Bundle Size**: Still lightweight at ~30KB despite significant new features

### 📝 Documentation

- Enhanced package.json with comprehensive keywords for better npm searchability:
  - Added 45+ keywords including: validation, zod, yup, joi, async-validation, form-validation, etc.
  - Improved description with feature highlights and comparisons
- Updated type exports for all new interfaces and types
- All new features include TypeScript documentation comments

### 🎯 Breaking Changes

None! This release is **100% backward compatible** with v1.1.0.

### 📦 What's Next

Phase 2 (Competitive Parity) will include:
- Advanced TypeScript inference improvements
- Discriminated unions (`discriminatedUnion()`)
- Recursive/lazy schemas (`lazy()`)
- Pipeline validation (`.pipe()`)
- Super refine (`.superRefine()`)
- Branded types (`.brand()`)

---

## [1.1.0] - 2025-XX-XX

### Added
- Initial release with 53+ validators
- Hard/soft validation (unique feature)
- Schema composition (merge, pick, omit, partial)
- Frontend/Backend adapters
- Isomorphic validation engine
- Full TypeScript support

### Features
- String validators (17): email, url, ipAddress, alpha, alphanumeric, etc.
- Number validators (11): port, latitude, percentage, positive, etc.
- Date validators (10): today, age, weekday, between, etc.
- Array validators (6): includes, unique, sorted, etc.
- Object validators (4): keys, pick, omit, strict
- Common validators (5): matches, greaterThan, dependsOn, when

---

## Links

- [Full Roadmap](./nextFeatureStep.md)
- [GitHub Repository](https://github.com/Gaurav-pasi/unischema)
- [npm Package](https://www.npmjs.com/package/unischema)
- [Report Issues](https://github.com/Gaurav-pasi/unischema/issues)
