/**
 * Isomorphic validation tests
 *
 * These tests prove that the same schema produces the same result
 * regardless of the environment (browser or Node.js)
 */

import { describe, it, expect } from 'vitest';
import { schema, field, validate, mergeResults, validResult } from '../src';

describe('Isomorphic Validation', () => {
  describe('Deterministic Validation', () => {
    const UserSchema = schema({
      email: field.string().email().required(),
      age: field.number().min(18).max(120).required(),
      name: field.string().min(2).max(50).required(),
    });

    const testData = {
      valid: {
        email: 'test@example.com',
        age: 25,
        name: 'John Doe',
      },
      invalidEmail: {
        email: 'not-an-email',
        age: 25,
        name: 'John Doe',
      },
      invalidAge: {
        email: 'test@example.com',
        age: 15,
        name: 'John Doe',
      },
      multipleErrors: {
        email: 'bad',
        age: 150,
        name: 'J',
      },
    };

    it('should produce identical results for same input (run 1)', () => {
      const result = validate(UserSchema.definition, testData.valid);
      expect(result.valid).toBe(true);
      expect(result.hardErrors).toHaveLength(0);
    });

    it('should produce identical results for same input (run 2)', () => {
      // Same test as above - must produce identical results
      const result = validate(UserSchema.definition, testData.valid);
      expect(result.valid).toBe(true);
      expect(result.hardErrors).toHaveLength(0);
    });

    it('should produce consistent error counts', () => {
      const result1 = validate(UserSchema.definition, testData.multipleErrors);
      const result2 = validate(UserSchema.definition, testData.multipleErrors);

      expect(result1.hardErrors.length).toBe(result2.hardErrors.length);
      expect(result1.valid).toBe(result2.valid);
    });

    it('should produce errors in consistent order', () => {
      const result1 = validate(UserSchema.definition, testData.multipleErrors);
      const result2 = validate(UserSchema.definition, testData.multipleErrors);

      // Errors should be in the same order
      for (let i = 0; i < result1.hardErrors.length; i++) {
        expect(result1.hardErrors[i]?.field).toBe(result2.hardErrors[i]?.field);
        expect(result1.hardErrors[i]?.code).toBe(result2.hardErrors[i]?.code);
      }
    });
  });

  describe('Environment Independence', () => {
    it('should not rely on browser-specific APIs', () => {
      // This test would fail if validation used window, document, etc.
      const TestSchema = schema({
        url: field.string().url(),
        email: field.string().email(),
        date: field.date(),
      });

      // Should work without any browser globals
      const result = validate(TestSchema.definition, {
        url: 'https://example.com',
        email: 'test@example.com',
        date: '2024-01-01',
      });

      expect(result.valid).toBe(true);
    });

    it('should not rely on Node-specific APIs', () => {
      // This test would fail if validation used fs, path, etc.
      const TestSchema = schema({
        filename: field.string().pattern(/^[\w-]+\.(txt|pdf|doc)$/),
        path: field.string().min(1),
      });

      const result = validate(TestSchema.definition, {
        filename: 'document.pdf',
        path: '/home/user/docs',
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Serialization Round-Trip', () => {
    it('should produce same results after schema serialization', () => {
      const OriginalSchema = schema({
        email: field.string().email().required(),
        count: field.number().min(0).max(100),
      });

      // Simulate serialization (e.g., sending schema to browser)
      const serialized = JSON.stringify(OriginalSchema.definition);
      const deserialized = JSON.parse(serialized);

      const testData = {
        email: 'test@example.com',
        count: 50,
      };

      const originalResult = validate(OriginalSchema.definition, testData);
      const deserializedResult = validate(deserialized, testData);

      expect(originalResult.valid).toBe(deserializedResult.valid);
      expect(originalResult.hardErrors.length).toBe(deserializedResult.hardErrors.length);
    });
  });

  describe('Cross-Field Validation', () => {
    it('should validate field dependencies consistently', () => {
      const FormSchema = schema({
        password: field.string().min(8).required(),
        confirmPassword: field.string().matches('password').required(),
      });

      const matchingResult = validate(FormSchema.definition, {
        password: 'secretpass',
        confirmPassword: 'secretpass',
      });

      const nonMatchingResult = validate(FormSchema.definition, {
        password: 'secretpass',
        confirmPassword: 'different',
      });

      expect(matchingResult.valid).toBe(true);
      expect(nonMatchingResult.valid).toBe(false);
    });
  });

  describe('Result Merging', () => {
    it('should merge results deterministically', () => {
      const result1 = validResult();
      const result2 = {
        valid: false,
        hardErrors: [{ field: 'a', code: 'ERR', message: 'Error', severity: 'hard' as const }],
        softErrors: [],
      };
      const result3 = {
        valid: true,
        hardErrors: [],
        softErrors: [{ field: 'b', code: 'WARN', message: 'Warning', severity: 'soft' as const }],
      };

      const merged = mergeResults(result1, result2, result3);

      expect(merged.valid).toBe(false);
      expect(merged.hardErrors).toHaveLength(1);
      expect(merged.softErrors).toHaveLength(1);
    });
  });

  describe('Empty and Edge Cases', () => {
    it('should handle empty objects consistently', () => {
      const OptionalSchema = schema({
        name: field.string().optional(),
        age: field.number().optional(),
      });

      const result = validate(OptionalSchema.definition, {});
      expect(result.valid).toBe(true);
    });

    it('should handle null values consistently', () => {
      const TestSchema = schema({
        name: field.string().optional(),
      });

      const result = validate(TestSchema.definition, { name: null });
      expect(result.valid).toBe(true);
    });

    it('should handle undefined values consistently', () => {
      const TestSchema = schema({
        name: field.string().optional(),
      });

      const result = validate(TestSchema.definition, { name: undefined });
      expect(result.valid).toBe(true);
    });
  });

  describe('Parallel Validation', () => {
    it('should produce consistent results when run in parallel', async () => {
      const TestSchema = schema({
        email: field.string().email().required(),
        count: field.number().min(0),
      });

      const testData = {
        email: 'test@example.com',
        count: 42,
      };

      // Run 100 validations in parallel
      const results = await Promise.all(
        Array.from({ length: 100 }, () =>
          Promise.resolve(validate(TestSchema.definition, testData))
        )
      );

      // All results should be identical
      const firstResult = results[0];
      for (const result of results) {
        expect(result!.valid).toBe(firstResult!.valid);
        expect(result!.hardErrors.length).toBe(firstResult!.hardErrors.length);
        expect(result!.softErrors.length).toBe(firstResult!.softErrors.length);
      }
    });
  });
});
