/**
 * Phase 1.1: Async Validation Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { schema, field, validateAsync, isValidAsync, assertValidAsync } from '../src';

describe('Phase 1.1: Async Validation', () => {
  describe('refineAsync()', () => {
    it('should validate async with simple boolean return', async () => {
      const testSchema = schema({
        email: field.string().email().refineAsync(async (email) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 10));
          return email !== 'taken@example.com';
        }, 'Email already exists'),
      });

      const validResult = await validateAsync(testSchema.definition, {
        email: 'available@example.com',
      });
      expect(validResult.valid).toBe(true);
      expect(validResult.hardErrors).toHaveLength(0);

      const invalidResult = await validateAsync(testSchema.definition, {
        email: 'taken@example.com',
      });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors).toHaveLength(1);
      expect(invalidResult.hardErrors[0].message).toBe('Email already exists');
    });

    it('should validate async with object return', async () => {
      const testSchema = schema({
        username: field.string().refineAsync(async (username) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          if (username === 'admin') {
            return { valid: false, message: 'Username is reserved' };
          }
          return { valid: true };
        }),
      });

      const result = await validateAsync(testSchema.definition, {
        username: 'admin',
      });
      expect(result.valid).toBe(false);
      expect(result.hardErrors[0].message).toBe('Username is reserved');
    });

    it('should handle async validation timeout', async () => {
      const testSchema = schema({
        value: field.string().refineAsync(
          async () => {
            // Simulate slow API
            await new Promise(resolve => setTimeout(resolve, 100));
            return true;
          },
          { timeout: 50 }
        ),
      });

      const result = await validateAsync(testSchema.definition, {
        value: 'test',
      });
      expect(result.valid).toBe(false);
      expect(result.hardErrors[0].code).toBe('ASYNC_VALIDATION_ERROR');
    });

    it('should support multiple async validators', async () => {
      let call1 = false;
      let call2 = false;

      const testSchema = schema({
        email: field
          .string()
          .email()
          .refineAsync(async () => {
            call1 = true;
            return true;
          })
          .refineAsync(async () => {
            call2 = true;
            return true;
          }),
      });

      await validateAsync(testSchema.definition, { email: 'test@example.com' });
      expect(call1).toBe(true);
      expect(call2).toBe(true);
    });
  });

  describe('refineAsyncSoft()', () => {
    it('should create soft async validation', async () => {
      const testSchema = schema({
        password: field
          .string()
          .min(8)
          .refineAsyncSoft(async (pwd) => {
            // Check password strength
            return pwd.length >= 12;
          }, 'Recommended: Use 12+ characters for strong password'),
      });

      const result = await validateAsync(testSchema.definition, {
        password: 'short123',
      });
      expect(result.valid).toBe(true); // Valid because soft error
      expect(result.softErrors).toHaveLength(1);
      expect(result.softErrors[0].severity).toBe('soft');
    });
  });

  describe('validateAsync()', () => {
    it('should validate entire schema asynchronously', async () => {
      const UserSchema = schema({
        email: field.string().email().refineAsync(async (email) => {
          return !email.includes('spam');
        }, 'Email domain not allowed'),
        age: field.number().min(18),
      });

      const result = await validateAsync(UserSchema.definition, {
        email: 'spam@example.com',
        age: 25,
      });

      expect(result.valid).toBe(false);
      expect(result.hardErrors.length).toBeGreaterThan(0);
    });

    it('should validate nested objects with async', async () => {
      const testSchema = schema({
        user: field.object({
          email: field.string().refineAsync(async () => true),
        }),
      });

      const result = await validateAsync(testSchema.definition, {
        user: { email: 'test@example.com' },
      });
      expect(result.valid).toBe(true);
    });

    it('should validate array items with async', async () => {
      const testSchema = schema({
        emails: field.array(
          field.string().refineAsync(async (email) => {
            return email.length > 5;
          })
        ),
      });

      const result = await validateAsync(testSchema.definition, {
        emails: ['short', 'longenough@example.com'],
      });

      expect(result.valid).toBe(false);
      expect(result.hardErrors.length).toBeGreaterThan(0);
    });
  });

  describe('isValidAsync()', () => {
    it('should return boolean for async validation', async () => {
      const testSchema = schema({
        value: field.string().refineAsync(async () => true),
      });

      const isValid = await isValidAsync(testSchema.definition, { value: 'test' });
      expect(isValid).toBe(true);
    });
  });

  describe('assertValidAsync()', () => {
    it('should throw on invalid async validation', async () => {
      const testSchema = schema({
        value: field.string().refineAsync(async () => false, 'Invalid'),
      });

      await expect(
        assertValidAsync(testSchema.definition, { value: 'test' })
      ).rejects.toThrow('Async validation failed');
    });

    it('should not throw on valid async validation', async () => {
      const testSchema = schema({
        value: field.string().refineAsync(async () => true),
      });

      const result = await assertValidAsync(testSchema.definition, { value: 'test' });
      expect(result).toEqual({ value: 'test' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle async validation with undefined values', async () => {
      const testSchema = schema({
        optional: field.string().optional().refineAsync(async () => true),
      });

      const result = await validateAsync(testSchema.definition, {});
      expect(result.valid).toBe(true);
    });

    it('should handle async validation errors', async () => {
      const testSchema = schema({
        value: field.string().refineAsync(async () => {
          throw new Error('Network error');
        }),
      });

      const result = await validateAsync(testSchema.definition, { value: 'test' });
      expect(result.valid).toBe(false);
      expect(result.hardErrors[0].message).toContain('Network error');
    });

    it('should handle parallel async validations', async () => {
      const testSchema = schema({
        field1: field.string().refineAsync(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return true;
        }),
        field2: field.string().refineAsync(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return true;
        }),
      });

      const startTime = Date.now();
      await validateAsync(testSchema.definition, {
        field1: 'test1',
        field2: 'test2',
      });
      const duration = Date.now() - startTime;

      // Should run in parallel, not sequential (< 100ms instead of > 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
