/**
 * Schema composition and type inference tests
 */

import { describe, it, expect } from 'vitest';
import {
  schema,
  field,
  extend,
  pick,
  omit,
  partial,
  merge,
  validate,
  type InferInput,
} from '../src';

describe('Schema Definition', () => {
  describe('Basic Schema Creation', () => {
    it('should create a schema from field definitions', () => {
      const UserSchema = schema({
        email: field.string().email().required(),
        name: field.string().min(2),
        age: field.number().min(0),
      });

      expect(UserSchema.definition).toBeDefined();
      expect(UserSchema.definition.fields).toBeDefined();
      expect(Object.keys(UserSchema.definition.fields)).toHaveLength(3);
    });

    it('should preserve field types in schema', () => {
      const TestSchema = schema({
        str: field.string(),
        num: field.number(),
        bool: field.boolean(),
        date: field.date(),
        arr: field.array(field.string()),
      });

      expect(TestSchema.definition.fields.str?.type).toBe('string');
      expect(TestSchema.definition.fields.num?.type).toBe('number');
      expect(TestSchema.definition.fields.bool?.type).toBe('boolean');
      expect(TestSchema.definition.fields.date?.type).toBe('date');
      expect(TestSchema.definition.fields.arr?.type).toBe('array');
    });

    it('should preserve validation rules', () => {
      const TestSchema = schema({
        email: field.string().email().min(5).max(100).required(),
      });

      const emailField = TestSchema.definition.fields.email;
      expect(emailField?.required).toBe(true);
      expect(emailField?.rules).toContainEqual(expect.objectContaining({ type: 'email' }));
      expect(emailField?.rules).toContainEqual(expect.objectContaining({ type: 'min' }));
      expect(emailField?.rules).toContainEqual(expect.objectContaining({ type: 'max' }));
    });
  });

  describe('Schema Composition', () => {
    const AddressSchema = schema({
      street: field.string().required(),
      city: field.string().required(),
      zipCode: field.string().pattern(/^\d{5}$/),
    });

    const BaseUserSchema = schema({
      id: field.string().required(),
      email: field.string().email().required(),
    });

    it('should extend schema with additional fields', () => {
      const ExtendedSchema = extend(BaseUserSchema, {
        name: field.string().min(2),
        phone: field.string(),
      });

      expect(Object.keys(ExtendedSchema.definition.fields)).toHaveLength(4);
      expect(ExtendedSchema.definition.fields.id).toBeDefined();
      expect(ExtendedSchema.definition.fields.email).toBeDefined();
      expect(ExtendedSchema.definition.fields.name).toBeDefined();
      expect(ExtendedSchema.definition.fields.phone).toBeDefined();
    });

    it('should pick specific fields from schema', () => {
      const FullSchema = schema({
        id: field.string().required(),
        email: field.string().email().required(),
        password: field.string().min(8).required(),
        name: field.string(),
      });

      const PublicSchema = pick(FullSchema, ['id', 'email', 'name']);

      expect(Object.keys(PublicSchema.definition.fields)).toHaveLength(3);
      expect(PublicSchema.definition.fields.id).toBeDefined();
      expect(PublicSchema.definition.fields.email).toBeDefined();
      expect(PublicSchema.definition.fields.name).toBeDefined();
      expect(PublicSchema.definition.fields.password).toBeUndefined();
    });

    it('should omit specific fields from schema', () => {
      const FullSchema = schema({
        id: field.string().required(),
        email: field.string().email().required(),
        password: field.string().min(8).required(),
        createdAt: field.date(),
      });

      const CreateSchema = omit(FullSchema, ['id', 'createdAt']);

      expect(Object.keys(CreateSchema.definition.fields)).toHaveLength(2);
      expect(CreateSchema.definition.fields.email).toBeDefined();
      expect(CreateSchema.definition.fields.password).toBeDefined();
      expect(CreateSchema.definition.fields.id).toBeUndefined();
      expect(CreateSchema.definition.fields.createdAt).toBeUndefined();
    });

    it('should make all fields optional with partial', () => {
      const RequiredSchema = schema({
        email: field.string().email().required(),
        name: field.string().required(),
      });

      const PartialSchema = partial(RequiredSchema);

      expect(PartialSchema.definition.fields.email?.required).toBe(false);
      expect(PartialSchema.definition.fields.name?.required).toBe(false);

      // Should validate with empty data
      const result = validate(PartialSchema.definition, {});
      expect(result.valid).toBe(true);
    });

    it('should merge two schemas', () => {
      const Schema1 = schema({
        field1: field.string(),
        field2: field.number(),
      });

      const Schema2 = schema({
        field3: field.boolean(),
        field4: field.date(),
      });

      const MergedSchema = merge(Schema1, Schema2);

      expect(Object.keys(MergedSchema.definition.fields)).toHaveLength(4);
      expect(MergedSchema.definition.fields.field1).toBeDefined();
      expect(MergedSchema.definition.fields.field2).toBeDefined();
      expect(MergedSchema.definition.fields.field3).toBeDefined();
      expect(MergedSchema.definition.fields.field4).toBeDefined();
    });
  });

  describe('Nested Schemas', () => {
    it('should validate nested object fields', () => {
      const AddressSchema = schema({
        street: field.string().required(),
        city: field.string().required(),
      });

      const UserSchema = schema({
        name: field.string().required(),
        address: field.object(AddressSchema).required(),
      });

      const validResult = validate(UserSchema.definition, {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      });

      expect(validResult.valid).toBe(true);

      const invalidResult = validate(UserSchema.definition, {
        name: 'John',
        address: {
          street: '',
          city: '',
        },
      });

      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors).toHaveLength(2);
      expect(invalidResult.hardErrors[0]?.field).toBe('address.street');
      expect(invalidResult.hardErrors[1]?.field).toBe('address.city');
    });

    it('should validate array of objects', () => {
      const ItemSchema = schema({
        name: field.string().required(),
        quantity: field.number().min(1).required(),
      });

      const OrderSchema = schema({
        items: field
          .array(field.object(ItemSchema))
          .min(1, 'At least one item required')
          .required(),
      });

      const validResult = validate(OrderSchema.definition, {
        items: [
          { name: 'Widget', quantity: 2 },
          { name: 'Gadget', quantity: 1 },
        ],
      });

      expect(validResult.valid).toBe(true);

      const invalidResult = validate(OrderSchema.definition, {
        items: [
          { name: '', quantity: 0 },
        ],
      });

      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors.some((e) => e.field === 'items[0].name')).toBe(true);
      expect(invalidResult.hardErrors.some((e) => e.field === 'items[0].quantity')).toBe(true);
    });
  });

  describe('Enum Fields', () => {
    it('should validate enum values', () => {
      const StatusSchema = schema({
        status: field.string().enum(['active', 'inactive', 'pending'] as const).required(),
      });

      const validResult = validate(StatusSchema.definition, { status: 'active' });
      expect(validResult.valid).toBe(true);

      const invalidResult = validate(StatusSchema.definition, { status: 'unknown' });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('INVALID_ENUM');
    });
  });

  describe('Field Matching', () => {
    it('should validate matching fields (password confirmation)', () => {
      const PasswordSchema = schema({
        password: field.string().min(8).required(),
        confirmPassword: field.string().matches('password', 'Passwords must match').required(),
      });

      const validResult = validate(PasswordSchema.definition, {
        password: 'secretpass123',
        confirmPassword: 'secretpass123',
      });

      expect(validResult.valid).toBe(true);

      const invalidResult = validate(PasswordSchema.definition, {
        password: 'secretpass123',
        confirmPassword: 'different',
      });

      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.hardErrors[0]?.code).toBe('FIELD_MISMATCH');
    });
  });
});

describe('Type Inference', () => {
  it('should infer correct types from schema', () => {
    const UserSchema = schema({
      email: field.string().email().required(),
      age: field.number().min(0),
      active: field.boolean(),
      tags: field.array(field.string()),
    });

    // This is a compile-time check - if types are wrong, TypeScript will error
    type User = InferInput<typeof UserSchema>;

    const user: User = {
      email: 'test@example.com',
      age: 25,
      active: true,
      tags: ['admin', 'user'],
    };

    expect(user.email).toBe('test@example.com');
  });

  it('should infer nested object types', () => {
    const AddressSchema = schema({
      street: field.string().required(),
      city: field.string().required(),
    });

    const UserSchema = schema({
      name: field.string().required(),
      address: field.object(AddressSchema),
    });

    type User = InferInput<typeof UserSchema>;

    const user: User = {
      name: 'John',
      address: {
        street: '123 Main St',
        city: 'New York',
      },
    };

    expect(user.address.city).toBe('New York');
  });
});
