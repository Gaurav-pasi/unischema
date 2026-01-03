/**
 * Hard vs Soft validation tests
 */

import { describe, it, expect } from 'vitest';
import { schema, field, validate } from '../src';

describe('Hard vs Soft Validation', () => {
  describe('Hard Validations (Blocking)', () => {
    it('should block form submission on hard errors', () => {
      const FormSchema = schema({
        email: field.string().email().required(),
        age: field.number().min(18).required(),
      });

      const result = validate(FormSchema.definition, {
        email: 'invalid',
        age: 16,
      });

      expect(result.valid).toBe(false);
      expect(result.hardErrors).toHaveLength(2);
      expect(result.hardErrors.every((e) => e.severity === 'hard')).toBe(true);
    });

    it('should pass with no hard errors', () => {
      const FormSchema = schema({
        email: field.string().email().required(),
      });

      const result = validate(FormSchema.definition, {
        email: 'test@example.com',
      });

      expect(result.valid).toBe(true);
      expect(result.hardErrors).toHaveLength(0);
    });
  });

  describe('Soft Validations (Warnings)', () => {
    it('should return soft errors as warnings', () => {
      const FormSchema = schema({
        age: field.number().min(18).minSoft(21, 'User is under 21'),
      });

      const result = validate(FormSchema.definition, { age: 19 });

      expect(result.valid).toBe(true); // Still valid!
      expect(result.hardErrors).toHaveLength(0);
      expect(result.softErrors).toHaveLength(1);
      expect(result.softErrors[0]?.severity).toBe('soft');
      expect(result.softErrors[0]?.message).toBe('User is under 21');
    });

    it('should not block submission on soft errors only', () => {
      const FormSchema = schema({
        email: field.string().email().required(),
        password: field.string().min(8).minSoft(12, 'Consider using a longer password'),
      });

      const result = validate(FormSchema.definition, {
        email: 'test@example.com',
        password: 'password1', // 9 chars - passes hard validation (8), fails soft (12)
      });

      expect(result.valid).toBe(true);
      expect(result.hardErrors).toHaveLength(0);
      expect(result.softErrors).toHaveLength(1);
    });

    it('should combine hard and soft errors', () => {
      const FormSchema = schema({
        email: field.string().email().required(),
        age: field.number().min(0).minSoft(18, 'User is a minor'),
      });

      const result = validate(FormSchema.definition, {
        email: 'invalid',
        age: 15,
      });

      expect(result.valid).toBe(false);
      expect(result.hardErrors).toHaveLength(1);
      expect(result.hardErrors[0]?.field).toBe('email');
      expect(result.softErrors).toHaveLength(1);
      expect(result.softErrors[0]?.field).toBe('age');
    });
  });

  describe('Mixed Validation Scenarios', () => {
    it('should handle enterprise-style validation (credit check scenario)', () => {
      const TransactionSchema = schema({
        // Hard validations - must pass
        amount: field.number().min(0.01, 'Amount must be positive').required(),
        accountId: field.string().min(1).required(),

        // Soft validations - warnings only
        notes: field.string().maxSoft(100, 'Consider adding more details'),
      });

      const result = validate(TransactionSchema.definition, {
        amount: 1000,
        accountId: 'ACC-123',
        notes: 'x'.repeat(50), // Within soft limit
      });

      expect(result.valid).toBe(true);
      expect(result.softErrors).toHaveLength(0);
    });

    it('should handle risk assessment patterns', () => {
      const LoanApplicationSchema = schema({
        // Hard requirements
        income: field.number().min(0).required(),
        employmentYears: field.number().min(0).required(),

        // Soft warnings for risk assessment
        creditScore: field.number()
          .min(300) // Hard minimum
          .minSoft(650, 'Credit score below recommended threshold'),
      });

      // Application with low credit score
      const result = validate(LoanApplicationSchema.definition, {
        income: 50000,
        employmentYears: 3,
        creditScore: 580, // Above 300 (hard), below 650 (soft)
      });

      expect(result.valid).toBe(true);
      expect(result.hardErrors).toHaveLength(0);
      expect(result.softErrors).toHaveLength(1);
      expect(result.softErrors[0]?.message).toContain('below recommended threshold');
    });

    it('should handle compliance warning patterns', () => {
      const ComplianceSchema = schema({
        transactionAmount: field.number()
          .min(0)
          .maxSoft(10000, 'Large transaction - requires additional review')
          .required(),

        country: field.string().required(),
      });

      const result = validate(ComplianceSchema.definition, {
        transactionAmount: 15000,
        country: 'US',
      });

      expect(result.valid).toBe(true);
      expect(result.softErrors).toHaveLength(1);
      expect(result.softErrors[0]?.message).toContain('additional review');
    });
  });

  describe('Custom Soft Validations', () => {
    it('should support custom soft validation functions', () => {
      const UserSchema = schema({
        password: field.string()
          .min(8)
          .required()
          .softCustom(
            (value) => {
              if (typeof value !== 'string') return true;
              const hasUppercase = /[A-Z]/.test(value);
              const hasNumber = /[0-9]/.test(value);
              return hasUppercase && hasNumber;
            },
            'Consider adding uppercase letters and numbers'
          ),
      });

      const result = validate(UserSchema.definition, {
        password: 'simplepassword', // No uppercase, no numbers
      });

      expect(result.valid).toBe(true);
      expect(result.softErrors).toHaveLength(1);
    });

    it('should support soft validation on number ranges', () => {
      const AgeSchema = schema({
        age: field.number()
          .min(0)
          .warnBelow(13, 'User may need parental consent')
          .warnAbove(100, 'Please verify age'),
      });

      const youngResult = validate(AgeSchema.definition, { age: 10 });
      expect(youngResult.valid).toBe(true);
      expect(youngResult.softErrors).toHaveLength(1);
      expect(youngResult.softErrors[0]?.message).toContain('parental consent');

      const oldResult = validate(AgeSchema.definition, { age: 105 });
      expect(oldResult.valid).toBe(true);
      expect(oldResult.softErrors).toHaveLength(1);
      expect(oldResult.softErrors[0]?.message).toContain('verify age');
    });
  });

  describe('Error Severity Structure', () => {
    it('should have correct severity on all errors', () => {
      const TestSchema = schema({
        email: field.string().email().required(), // Hard
        notes: field.string().maxSoft(10, 'Too long'), // Soft
      });

      const result = validate(TestSchema.definition, {
        email: 'invalid',
        notes: 'This is a very long note that exceeds the limit',
      });

      // All hard errors should have severity 'hard'
      for (const error of result.hardErrors) {
        expect(error.severity).toBe('hard');
      }

      // All soft errors should have severity 'soft'
      for (const error of result.softErrors) {
        expect(error.severity).toBe('soft');
      }
    });

    it('should include field path in all errors', () => {
      const TestSchema = schema({
        user: field.object({
          email: field.string().email().required(),
        }).required(),
      });

      const result = validate(TestSchema.definition, {
        user: { email: 'invalid' },
      });

      expect(result.hardErrors[0]?.field).toBe('user.email');
    });
  });
});
