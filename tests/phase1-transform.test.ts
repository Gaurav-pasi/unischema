/**
 * Phase 1.2: Transform & Coerce Tests
 */

import { describe, it, expect } from 'vitest';
import { schema, field, coerce, validate } from '../src';

describe('Phase 1.2: Transform & Coerce', () => {
  describe('transform()', () => {
    it('should transform string values', () => {
      const testSchema = schema({
        email: field
          .string()
          .transform(s => s.trim())
          .transform(s => s.toLowerCase())
          .email(),
      });

      const result = validate(testSchema.definition, {
        email: '  TEST@EXAMPLE.COM  ',
      });

      expect(result.valid).toBe(true);
    });

    it('should chain multiple transforms', () => {
      const testSchema = schema({
        name: field
          .string()
          .transform(s => s.trim())
          .transform(s => s.replace(/\s+/g, ' '))
          .transform(s => s.substring(0, 10)),
      });

      const result = validate(testSchema.definition, {
        name: '  John   Doe   Extra   Long   Name  ',
      });

      expect(result.valid).toBe(true);
    });

    it('should transform numbers', () => {
      const testSchema = schema({
        price: field
          .number()
          .transform(n => Math.round(n))
          .integer(),
      });

      const result = validate(testSchema.definition, {
        price: 99.99,
      });

      expect(result.valid).toBe(true);
    });

    it('should apply transform before validation', () => {
      const testSchema = schema({
        value: field
          .string()
          .transform(s => s.toUpperCase())
          .pattern(/^[A-Z]+$/),
      });

      const result = validate(testSchema.definition, {
        value: 'lowercase',
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('preprocess()', () => {
    it('should preprocess before transforms', () => {
      const testSchema = schema({
        value: field
          .string()
          .preprocess(v => v ?? 'default')
          .transform(s => s.toUpperCase()),
      });

      const result = validate(testSchema.definition, {});
      expect(result.valid).toBe(true);
    });

    it('should handle null/undefined values', () => {
      const testSchema = schema({
        optional: field
          .string()
          .preprocess(v => v?.toString().trim() || '')
          .optional(),
      });

      const result1 = validate(testSchema.definition, { optional: null });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { optional: undefined });
      expect(result2.valid).toBe(true);
    });

    it('should allow trimming with preprocess', () => {
      const testSchema = schema({
        email: field
          .string()
          .preprocess(v => (typeof v === 'string' ? v.trim() : v))
          .email(),
      });

      const result = validate(testSchema.definition, {
        email: '  test@example.com  ',
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('coerce.string()', () => {
    it('should coerce number to string', () => {
      const testSchema = schema({
        value: coerce.string().min(2),
      });

      const result = validate(testSchema.definition, { value: 123 });
      expect(result.valid).toBe(true);
    });

    it('should coerce boolean to string', () => {
      const testSchema = schema({
        value: coerce.string(),
      });

      const result = validate(testSchema.definition, { value: true });
      expect(result.valid).toBe(true);
    });

    it('should keep string as string', () => {
      const testSchema = schema({
        value: coerce.string().email(),
      });

      const result = validate(testSchema.definition, { value: 'test@example.com' });
      expect(result.valid).toBe(true);
    });
  });

  describe('coerce.number()', () => {
    it('should coerce string to number', () => {
      const testSchema = schema({
        age: coerce.number().min(18),
      });

      const result = validate(testSchema.definition, { age: '25' });
      expect(result.valid).toBe(true);
    });

    it('should coerce boolean to number', () => {
      const testSchema = schema({
        value: coerce.number(),
      });

      const result1 = validate(testSchema.definition, { value: true });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { value: false });
      expect(result2.valid).toBe(true);
    });

    it('should keep number as number', () => {
      const testSchema = schema({
        value: coerce.number().positive(),
      });

      const result = validate(testSchema.definition, { value: 42 });
      expect(result.valid).toBe(true);
    });

    it('should handle invalid string numbers', () => {
      const testSchema = schema({
        value: coerce.number(),
      });

      const result = validate(testSchema.definition, { value: 'not-a-number' });
      // Coercion fails, validation should catch it
      expect(result.valid).toBe(false);
    });
  });

  describe('coerce.boolean()', () => {
    it('should coerce "true" string to boolean', () => {
      const testSchema = schema({
        agree: coerce.boolean(),
      });

      const tests = ['true', 'TRUE', 'True', '1', 'yes', 'YES', 'on'];
      tests.forEach(value => {
        const result = validate(testSchema.definition, { agree: value });
        expect(result.valid).toBe(true);
      });
    });

    it('should coerce "false" string to boolean', () => {
      const testSchema = schema({
        agree: coerce.boolean(),
      });

      const tests = ['false', 'FALSE', 'False', '0', 'no', 'NO', 'off'];
      tests.forEach(value => {
        const result = validate(testSchema.definition, { agree: value });
        expect(result.valid).toBe(true);
      });
    });

    it('should coerce number to boolean', () => {
      const testSchema = schema({
        active: coerce.boolean(),
      });

      const result1 = validate(testSchema.definition, { active: 1 });
      expect(result1.valid).toBe(true);

      const result2 = validate(testSchema.definition, { active: 0 });
      expect(result2.valid).toBe(true);
    });
  });

  describe('coerce.date()', () => {
    it('should coerce string to date', () => {
      const testSchema = schema({
        birthday: coerce.date(),
      });

      const result = validate(testSchema.definition, {
        birthday: '2000-01-01',
      });
      expect(result.valid).toBe(true);
    });

    it('should coerce timestamp to date', () => {
      const testSchema = schema({
        created: coerce.date(),
      });

      const result = validate(testSchema.definition, {
        created: Date.now(),
      });
      expect(result.valid).toBe(true);
    });

    it('should keep Date as Date', () => {
      const testSchema = schema({
        date: coerce.date(),
      });

      const result = validate(testSchema.definition, {
        date: new Date(),
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('coerce.array()', () => {
    it('should coerce single value to array', () => {
      const testSchema = schema({
        tags: coerce.array(field.string()).min(1),
      });

      const result = validate(testSchema.definition, {
        tags: 'single-tag',
      });
      expect(result.valid).toBe(true);
    });

    it('should keep array as array', () => {
      const testSchema = schema({
        items: coerce.array(field.string()),
      });

      const result = validate(testSchema.definition, {
        items: ['one', 'two', 'three'],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('Complex Transform Pipelines', () => {
    it('should handle complex preprocess + transform + validation', () => {
      const testSchema = schema({
        email: field
          .string()
          .preprocess(v => v?.toString())
          .transform(s => s.trim())
          .transform(s => s.toLowerCase())
          .email(),
      });

      const result = validate(testSchema.definition, {
        email: '  TEST@EXAMPLE.COM  ',
      });
      expect(result.valid).toBe(true);
    });

    it('should work with coerce + transform + validation', () => {
      const testSchema = schema({
        price: coerce
          .number()
          .transform(n => Math.round(n * 100) / 100) // Round to 2 decimals
          .positive(),
      });

      const result = validate(testSchema.definition, {
        price: '19.999',
      });
      expect(result.valid).toBe(true);
    });
  });
});
