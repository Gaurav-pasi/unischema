/**
 * Phase 1.4: Enhanced Error Handling Tests
 */

import { describe, it, expect } from 'vitest';
import { schema, field, validate } from '../src';

describe('Phase 1.4: Enhanced Error Handling', () => {
  describe('Error Paths', () => {
    it('should include path array in errors', () => {
      const testSchema = schema({
        email: field.string().email(),
      });

      const result = validate(testSchema.definition, {
        email: 'invalid-email',
      });

      expect(result.valid).toBe(false);
      expect(result.hardErrors[0].path).toEqual(['email']);
    });

    it('should handle nested object paths', () => {
      const testSchema = schema({
        user: field.object({
          email: field.string().email(),
        }),
      });

      const result = validate(testSchema.definition, {
        user: { email: 'invalid' },
      });

      expect(result.valid).toBe(false);
      expect(result.hardErrors[0].path).toContain('user');
      expect(result.hardErrors[0].path).toContain('email');
    });

    it('should handle array item paths', () => {
      const testSchema = schema({
        emails: field.array(field.string().email()),
      });

      const result = validate(testSchema.definition, {
        emails: ['valid@example.com', 'invalid-email'],
      });

      expect(result.valid).toBe(false);
      const errorPath = result.hardErrors[0].field;
      expect(errorPath).toContain('[1]');
    });
  });

  describe('Error Context', () => {
    it('should include received value in errors', () => {
      const testSchema = schema({
        age: field.number().min(18),
      });

      const result = validate(testSchema.definition, {
        age: 15,
      });

      expect(result.valid).toBe(false);
      expect(result.hardErrors[0].received).toBe(15);
    });

    it('should include expected constraints in errors', () => {
      const testSchema = schema({
        password: field.string().min(8),
      });

      const result = validate(testSchema.definition, {
        password: 'short',
      });

      expect(result.valid).toBe(false);
      expect(result.hardErrors[0].expected).toBeDefined();
    });
  });

  describe('errorMap Option', () => {
    it('should customize error messages with errorMap', () => {
      const testSchema = schema({
        email: field.string().email(),
      });

      const result = validate(
        testSchema.definition,
        { email: 'invalid' },
        {
          errorMap: (error) => ({
            message: `Custom: ${error.message}`,
          }),
        }
      );

      expect(result.valid).toBe(false);
      expect(result.hardErrors[0].message).toContain('Custom:');
    });

    it('should map error codes to custom messages', () => {
      const testSchema = schema({
        email: field.string().email(),
        age: field.number().min(18),
      });

      const result = validate(
        testSchema.definition,
        {
          email: 'invalid@',
          age: 15,
        },
        {
          errorMap: (error) => {
            if (error.code === 'INVALID_EMAIL') {
              return { message: 'Please enter a valid email address' };
            }
            if (error.code === 'MIN_VALUE') {
              return { message: 'You must be 18 or older' };
            }
            return error;
          },
        }
      );

      expect(result.valid).toBe(false);
      expect(result.hardErrors.length).toBeGreaterThan(0);
    });

    it('should allow full error object replacement', () => {
      const testSchema = schema({
        value: field.string().min(5),
      });

      const result = validate(
        testSchema.definition,
        { value: 'abc' },
        {
          errorMap: (error) => ({
            ...error,
            message: 'Completely custom message',
            code: 'CUSTOM_CODE',
          }),
        }
      );

      expect(result.hardErrors[0].message).toBe('Completely custom message');
      expect(result.hardErrors[0].code).toBe('CUSTOM_CODE');
    });
  });

  describe('abortEarly Option', () => {
    it('should stop validation on first error when abortEarly is true', () => {
      const testSchema = schema({
        field1: field.string().email(),
        field2: field.string().min(5),
        field3: field.number().positive(),
      });

      const result = validate(
        testSchema.definition,
        {
          field1: 'invalid-email',
          field2: 'abc',
          field3: -5,
        },
        { abortEarly: true }
      );

      expect(result.valid).toBe(false);
      expect(result.hardErrors.length).toBe(1); // Only first error
    });

    it('should return all errors when abortEarly is false', () => {
      const testSchema = schema({
        field1: field.string().email(),
        field2: field.string().min(5),
        field3: field.number().positive(),
      });

      const result = validate(
        testSchema.definition,
        {
          field1: 'invalid-email',
          field2: 'abc',
          field3: -5,
        },
        { abortEarly: false }
      );

      expect(result.valid).toBe(false);
      expect(result.hardErrors.length).toBeGreaterThan(1);
    });
  });

  describe('aggregateByField Option', () => {
    it('should aggregate errors by field', () => {
      const testSchema = schema({
        email: field.string().email().min(5),
        password: field.string().min(8).pattern(/[A-Z]/),
      });

      const result = validate(
        testSchema.definition,
        {
          email: 'a',
          password: 'short',
        },
        { aggregateByField: true }
      );

      expect(result.valid).toBe(false);
      expect(result.errorsByField).toBeDefined();
      expect(result.errorsByField!['email']).toBeDefined();
      expect(result.errorsByField!['email'].length).toBeGreaterThan(0);
    });

    it('should group multiple errors for same field', () => {
      const testSchema = schema({
        password: field
          .string()
          .min(8)
          .pattern(/[A-Z]/)
          .pattern(/[0-9]/),
      });

      const result = validate(
        testSchema.definition,
        { password: 'abc' },
        { aggregateByField: true }
      );

      expect(result.valid).toBe(false);
      const passwordErrors = result.errorsByField!['password'];
      expect(passwordErrors.length).toBeGreaterThan(1);
    });

    it('should include both hard and soft errors in aggregation', () => {
      const testSchema = schema({
        password: field
          .string()
          .min(8) // Hard error
          .minSoft(12, 'Recommended: 12+ characters'), // Soft error
      });

      const result = validate(
        testSchema.definition,
        { password: 'short' },
        { aggregateByField: true }
      );

      const passwordErrors = result.errorsByField!['password'];
      expect(passwordErrors).toBeDefined();
      expect(passwordErrors.some((e) => e.severity === 'hard')).toBe(true);
      expect(passwordErrors.some((e) => e.severity === 'soft')).toBe(true);
    });
  });

  describe('Combined Options', () => {
    it('should work with errorMap + aggregateByField', () => {
      const testSchema = schema({
        email: field.string().email(),
        age: field.number().min(18),
      });

      const result = validate(
        testSchema.definition,
        {
          email: 'invalid',
          age: 15,
        },
        {
          errorMap: (error) => ({
            ...error,
            message: `CUSTOM: ${error.message}`,
          }),
          aggregateByField: true,
        }
      );

      expect(result.valid).toBe(false);
      expect(result.errorsByField).toBeDefined();
      expect(result.errorsByField!['email'][0].message).toContain('CUSTOM:');
    });

    it('should work with errorMap + abortEarly', () => {
      const testSchema = schema({
        field1: field.string().min(5),
        field2: field.string().min(5),
      });

      const result = validate(
        testSchema.definition,
        {
          field1: 'abc',
          field2: 'def',
        },
        {
          errorMap: (error) => ({ message: 'Custom error' }),
          abortEarly: true,
        }
      );

      expect(result.valid).toBe(false);
      expect(result.hardErrors.length).toBe(1);
      expect(result.hardErrors[0].message).toBe('Custom error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty errors with aggregation', () => {
      const testSchema = schema({
        value: field.string(),
      });

      const result = validate(
        testSchema.definition,
        { value: 'test' },
        { aggregateByField: true }
      );

      expect(result.valid).toBe(true);
      expect(result.errorsByField).toBeDefined();
      expect(Object.keys(result.errorsByField!).length).toBe(0);
    });

    it('should preserve error codes through errorMap', () => {
      const testSchema = schema({
        email: field.string().email(),
      });

      const result = validate(
        testSchema.definition,
        { email: 'invalid' },
        {
          errorMap: (error) => ({
            ...error,
            message: 'New message',
          }),
        }
      );

      expect(result.hardErrors[0].code).toBeDefined();
      expect(result.hardErrors[0].message).toBe('New message');
    });
  });
});
