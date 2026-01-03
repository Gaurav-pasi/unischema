/**
 * Core validation engine tests
 */

import { describe, it, expect } from 'vitest';
import { schema, field, validate, isValid, assertValid } from '../src';

describe('Core Validation Engine', () => {
  describe('validate()', () => {
    it('should validate a simple schema', () => {
      const UserSchema = schema({
        email: field.string().email().required(),
        name: field.string().min(2).required(),
      });

      const result = validate(UserSchema.definition, {
        email: 'test@example.com',
        name: 'John',
      });

      expect(result.valid).toBe(true);
      expect(result.hardErrors).toHaveLength(0);
      expect(result.softErrors).toHaveLength(0);
    });

    it('should return errors for invalid data', () => {
      const UserSchema = schema({
        email: field.string().email().required(),
        name: field.string().min(2).required(),
      });

      const result = validate(UserSchema.definition, {
        email: 'not-an-email',
        name: 'J',
      });

      expect(result.valid).toBe(false);
      expect(result.hardErrors).toHaveLength(2);
      expect(result.hardErrors[0]?.field).toBe('email');
      expect(result.hardErrors[1]?.field).toBe('name');
    });

    it('should handle missing required fields', () => {
      const UserSchema = schema({
        email: field.string().email().required(),
        name: field.string().required(),
      });

      const result = validate(UserSchema.definition, {
        email: '',
        name: '',
      });

      expect(result.valid).toBe(false);
      expect(result.hardErrors).toHaveLength(2);
      expect(result.hardErrors[0]?.code).toBe('REQUIRED');
      expect(result.hardErrors[1]?.code).toBe('REQUIRED');
    });

    it('should skip validation for optional empty fields', () => {
      const UserSchema = schema({
        email: field.string().email().optional(),
        age: field.number().min(18).optional(),
      });

      const result = validate(UserSchema.definition, {
        email: '',
        age: undefined,
      });

      expect(result.valid).toBe(true);
      expect(result.hardErrors).toHaveLength(0);
    });
  });

  describe('Type Validators', () => {
    it('should validate string type', () => {
      const TestSchema = schema({
        name: field.string().required(),
      });

      const validResult = validate(TestSchema.definition, { name: 'John' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { name: 123 as unknown as string });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('INVALID_TYPE');
    });

    it('should validate number type', () => {
      const TestSchema = schema({
        age: field.number().required(),
      });

      const validResult = validate(TestSchema.definition, { age: 25 });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { age: 'twenty' as unknown as number });
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate boolean type', () => {
      const TestSchema = schema({
        active: field.boolean().required(),
      });

      const validResult = validate(TestSchema.definition, { active: true });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { active: 'yes' as unknown as boolean });
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate array type', () => {
      const TestSchema = schema({
        tags: field.array(field.string()).required(),
      });

      const validResult = validate(TestSchema.definition, { tags: ['a', 'b'] });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { tags: 'not-array' as unknown as string[] });
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate date type', () => {
      const TestSchema = schema({
        createdAt: field.date().required(),
      });

      const validResult = validate(TestSchema.definition, { createdAt: new Date() });
      expect(validResult.valid).toBe(true);

      const validStringResult = validate(TestSchema.definition, { createdAt: '2024-01-01' });
      expect(validStringResult.valid).toBe(true);
    });
  });

  describe('Rule Validators', () => {
    it('should validate min length for strings', () => {
      const TestSchema = schema({
        name: field.string().min(3).required(),
      });

      const validResult = validate(TestSchema.definition, { name: 'John' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { name: 'Jo' });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('MIN_LENGTH');
    });

    it('should validate max length for strings', () => {
      const TestSchema = schema({
        name: field.string().max(5).required(),
      });

      const validResult = validate(TestSchema.definition, { name: 'John' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { name: 'Jonathan' });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('MAX_LENGTH');
    });

    it('should validate min value for numbers', () => {
      const TestSchema = schema({
        age: field.number().min(18).required(),
      });

      const validResult = validate(TestSchema.definition, { age: 25 });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { age: 16 });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('MIN_VALUE');
    });

    it('should validate max value for numbers', () => {
      const TestSchema = schema({
        score: field.number().max(100).required(),
      });

      const validResult = validate(TestSchema.definition, { score: 85 });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { score: 120 });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('MAX_VALUE');
    });

    it('should validate email format', () => {
      const TestSchema = schema({
        email: field.string().email().required(),
      });

      const validResult = validate(TestSchema.definition, { email: 'test@example.com' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { email: 'not-an-email' });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('INVALID_EMAIL');
    });

    it('should validate URL format', () => {
      const TestSchema = schema({
        website: field.string().url().required(),
      });

      const validResult = validate(TestSchema.definition, { website: 'https://example.com' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { website: 'not-a-url' });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('INVALID_URL');
    });

    it('should validate pattern matching', () => {
      const TestSchema = schema({
        code: field.string().pattern(/^[A-Z]{3}-\d{4}$/).required(),
      });

      const validResult = validate(TestSchema.definition, { code: 'ABC-1234' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { code: 'invalid' });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('PATTERN_MISMATCH');
    });

    it('should validate integer numbers', () => {
      const TestSchema = schema({
        count: field.number().integer().required(),
      });

      const validResult = validate(TestSchema.definition, { count: 42 });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { count: 3.14 });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('NOT_INTEGER');
    });

    it('should validate positive numbers', () => {
      const TestSchema = schema({
        amount: field.number().positive().required(),
      });

      const validResult = validate(TestSchema.definition, { amount: 100 });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(TestSchema.definition, { amount: -50 });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('NOT_POSITIVE');
    });
  });

  describe('isValid()', () => {
    it('should return true for valid data', () => {
      const UserSchema = schema({
        email: field.string().email().required(),
      });

      expect(isValid(UserSchema.definition, { email: 'test@example.com' })).toBe(true);
    });

    it('should return false for invalid data', () => {
      const UserSchema = schema({
        email: field.string().email().required(),
      });

      expect(isValid(UserSchema.definition, { email: 'invalid' })).toBe(false);
    });
  });

  describe('assertValid()', () => {
    it('should return data for valid input', () => {
      const UserSchema = schema({
        email: field.string().email().required(),
      });

      const data = { email: 'test@example.com' };
      expect(assertValid(UserSchema.definition, data)).toBe(data);
    });

    it('should throw for invalid input', () => {
      const UserSchema = schema({
        email: field.string().email().required(),
      });

      expect(() => assertValid(UserSchema.definition, { email: 'invalid' })).toThrow(
        'Validation failed'
      );
    });
  });
});
