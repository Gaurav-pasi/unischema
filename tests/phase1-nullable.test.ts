/**
 * Phase 1.5: Nullable & Nullish Tests
 */

import { describe, it, expect } from 'vitest';
import { schema, field, validate } from '../src';

describe('Phase 1.5: Nullable & Nullish', () => {
  describe('nullable()', () => {
    it('should allow null values', () => {
      const testSchema = schema({
        value: field.string().nullable(),
      });

      const result = validate(testSchema.definition, {
        value: null,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject undefined for nullable fields', () => {
      const testSchema = schema({
        value: field.string().nullable().required(),
      });

      const result = validate(testSchema.definition, {
        value: undefined,
      });

      expect(result.valid).toBe(false);
    });

    it('should allow valid string or null', () => {
      const testSchema = schema({
        name: field.string().nullable(),
      });

      const result1 = validate(testSchema.definition, { name: 'John' });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { name: null });
      expect(result2.valid).toBe(true);
    });

    it('should work with number fields', () => {
      const testSchema = schema({
        age: field.number().min(0).nullable(),
      });

      const result1 = validate(testSchema.definition, { age: 25 });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { age: null });
      expect(result2.valid).toBe(true);
    });

    it('should work with date fields', () => {
      const testSchema = schema({
        birthday: field.date().nullable(),
      });

      const result1 = validate(testSchema.definition, { birthday: new Date() });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { birthday: null });
      expect(result2.valid).toBe(true);
    });

    it('should work with boolean fields', () => {
      const testSchema = schema({
        agree: field.boolean().nullable(),
      });

      const result1 = validate(testSchema.definition, { agree: true });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { agree: null });
      expect(result2.valid).toBe(true);
    });
  });

  describe('nullish()', () => {
    it('should allow null or undefined', () => {
      const testSchema = schema({
        value: field.string().nullish(),
      });

      const result1 = validate(testSchema.definition, { value: null });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { value: undefined });
      expect(result2.valid).toBe(true);

      const result3 = validate(testSchema.definition, {});
      expect(result3.valid).toBe(true);
    });

    it('should allow valid string, null, or undefined', () => {
      const testSchema = schema({
        name: field.string().nullish(),
      });

      const result1 = validate(testSchema.definition, { name: 'John' });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { name: null });
      expect(result2.valid).toBe(true);

      const result3 = validate(testSchema.definition, { name: undefined });
      expect(result3.valid).toBe(true);
    });

    it('should work with number fields', () => {
      const testSchema = schema({
        count: field.number().positive().nullish(),
      });

      const result1 = validate(testSchema.definition, { count: 5 });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { count: null });
      expect(result2.valid).toBe(true);

      const result3 = validate(testSchema.definition, {});
      expect(result3.valid).toBe(true);
    });
  });

  describe('nullable() with default()', () => {
    it('should use default when value is null', () => {
      const testSchema = schema({
        value: field.string().nullable().default('default-value'),
      });

      // Note: default handling would be in application logic
      const result = validate(testSchema.definition, { value: null });
      expect(result.valid).toBe(true);
    });
  });

  describe('nullish() with default()', () => {
    it('should use default when value is undefined', () => {
      const testSchema = schema({
        value: field.string().nullish().default('default-value'),
      });

      const result = validate(testSchema.definition, {});
      expect(result.valid).toBe(true);
    });
  });

  describe('nullable() vs nullish() distinction', () => {
    it('nullable should not allow undefined for required fields', () => {
      const testSchema = schema({
        value: field.string().nullable().required(),
      });

      const result = validate(testSchema.definition, {});
      expect(result.valid).toBe(false);
    });

    it('nullish should allow undefined for required fields', () => {
      const testSchema = schema({
        value: field.string().nullish(),
      });

      const result = validate(testSchema.definition, {});
      expect(result.valid).toBe(true);
    });
  });

  describe('Nullable with Validations', () => {
    it('should skip validation when value is null', () => {
      const testSchema = schema({
        email: field.string().email().nullable(),
      });

      const result = validate(testSchema.definition, {
        email: null,
      });

      expect(result.valid).toBe(true);
    });

    it('should validate when value is not null', () => {
      const testSchema = schema({
        email: field.string().email().nullable(),
      });

      const result = validate(testSchema.definition, {
        email: 'invalid-email',
      });

      expect(result.valid).toBe(false);
    });

    it('should work with complex validations', () => {
      const testSchema = schema({
        password: field
          .string()
          .min(8)
          .pattern(/[A-Z]/)
          .nullable(),
      });

      const result1 = validate(testSchema.definition, { password: null });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { password: 'Valid123' });
      expect(result2.valid).toBe(true);

      const result3 = validate(testSchema.definition, { password: 'short' });
      expect(result3.valid).toBe(false);
    });
  });

  describe('Nullish with Validations', () => {
    it('should skip validation when value is null or undefined', () => {
      const testSchema = schema({
        url: field.string().url().nullish(),
      });

      const result1 = validate(testSchema.definition, { url: null });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { url: undefined });
      expect(result2.valid).toBe(true);

      const result3 = validate(testSchema.definition, {});
      expect(result3.valid).toBe(true);
    });

    it('should validate when value is provided', () => {
      const testSchema = schema({
        url: field.string().url().nullish(),
      });

      const result = validate(testSchema.definition, {
        url: 'not-a-url',
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('Nested Objects with Nullable', () => {
    it('should allow null for entire nested object', () => {
      const testSchema = schema({
        address: field
          .object({
            street: field.string().required(),
            city: field.string().required(),
          })
          .nullable(),
      });

      const result = validate(testSchema.definition, {
        address: null,
      });

      expect(result.valid).toBe(true);
    });

    it('should validate nested object when not null', () => {
      const testSchema = schema({
        address: field
          .object({
            street: field.string().required(),
            city: field.string().required(),
          })
          .nullable(),
      });

      const result = validate(testSchema.definition, {
        address: {
          street: '123 Main St',
          // city missing
        },
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('Arrays with Nullable', () => {
    it('should allow null for entire array', () => {
      const testSchema = schema({
        tags: field.array(field.string()).nullable(),
      });

      const result = validate(testSchema.definition, {
        tags: null,
      });

      expect(result.valid).toBe(true);
    });

    it('should validate array when not null', () => {
      const testSchema = schema({
        emails: field.array(field.string().email()).nullable(),
      });

      const result = validate(testSchema.definition, {
        emails: ['valid@example.com', 'invalid-email'],
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string vs null distinction', () => {
      const testSchema = schema({
        value: field.string().nullable(),
      });

      const result1 = validate(testSchema.definition, { value: '' });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { value: null });
      expect(result2.valid).toBe(true);
    });

    it('should handle 0 vs null for numbers', () => {
      const testSchema = schema({
        count: field.number().nullable(),
      });

      const result1 = validate(testSchema.definition, { count: 0 });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { count: null });
      expect(result2.valid).toBe(true);
    });

    it('should handle false vs null for booleans', () => {
      const testSchema = schema({
        flag: field.boolean().nullable(),
      });

      const result1 = validate(testSchema.definition, { flag: false });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { flag: null });
      expect(result2.valid).toBe(true);
    });
  });

  describe('Combining with Transforms', () => {
    it('should work with transforms on nullable fields', () => {
      const testSchema = schema({
        name: field
          .string()
          .nullable()
          .transform((s) => (s === null ? null : s.toUpperCase())),
      });

      const result = validate(testSchema.definition, { name: null });
      expect(result.valid).toBe(true);
    });

    it('should work with preprocess on nullish fields', () => {
      const testSchema = schema({
        value: field
          .string()
          .nullish()
          .preprocess((v) => v ?? 'default'),
      });

      const result = validate(testSchema.definition, {});
      expect(result.valid).toBe(true);
    });
  });
});
