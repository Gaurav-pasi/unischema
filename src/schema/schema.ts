/**
 * Schema builder and type inference
 */

import type { SchemaDefinition } from '../types';
import {
  BaseFieldBuilder,
  StringFieldBuilder,
  NumberFieldBuilder,
  BooleanFieldBuilder,
  DateFieldBuilder,
  ArrayFieldBuilder,
  ObjectFieldBuilder,
} from './field';

// ============================================================================
// Schema Builder
// ============================================================================

export interface SchemaBuilder<T extends Record<string, unknown>> {
  /** The built schema definition */
  definition: SchemaDefinition;
  /** Field definitions for type inference */
  _fields: Record<string, BaseFieldBuilder<unknown>>;
  /** Type marker (not used at runtime) */
  _type: T;
}

/**
 * Create a new schema from field definitions
 */
export function schema<
  F extends Record<string, BaseFieldBuilder<unknown>>
>(fields: F): SchemaBuilder<InferFields<F>> {
  const definition: SchemaDefinition = {
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, builder]) => [key, builder.build()])
    ),
  };

  return {
    definition,
    _fields: fields,
    _type: {} as InferFields<F>,
  };
}

/**
 * Extend an existing schema with additional fields
 */
export function extend<
  T extends Record<string, unknown>,
  F extends Record<string, BaseFieldBuilder<unknown>>
>(
  baseSchema: SchemaBuilder<T>,
  additionalFields: F
): SchemaBuilder<T & InferFields<F>> {
  const newFields = {
    ...baseSchema._fields,
    ...additionalFields,
  };

  return schema(newFields) as SchemaBuilder<T & InferFields<F>>;
}

/**
 * Pick specific fields from a schema
 */
export function pick<
  T extends Record<string, unknown>,
  K extends keyof T
>(
  baseSchema: SchemaBuilder<T>,
  keys: K[]
): SchemaBuilder<Pick<T, K>> {
  const pickedFields: Record<string, BaseFieldBuilder<unknown>> = {};
  for (const key of keys) {
    if (baseSchema._fields[key as string]) {
      pickedFields[key as string] = baseSchema._fields[key as string]!;
    }
  }
  return schema(pickedFields) as SchemaBuilder<Pick<T, K>>;
}

/**
 * Omit specific fields from a schema
 */
export function omit<
  T extends Record<string, unknown>,
  K extends keyof T
>(
  baseSchema: SchemaBuilder<T>,
  keys: K[]
): SchemaBuilder<Omit<T, K>> {
  const omitSet = new Set(keys as string[]);
  const remainingFields: Record<string, BaseFieldBuilder<unknown>> = {};
  for (const [key, builder] of Object.entries(baseSchema._fields)) {
    if (!omitSet.has(key)) {
      remainingFields[key] = builder;
    }
  }
  return schema(remainingFields) as SchemaBuilder<Omit<T, K>>;
}

/**
 * Make all fields optional
 */
export function partial<T extends Record<string, unknown>>(
  baseSchema: SchemaBuilder<T>
): SchemaBuilder<Partial<T>> {
  const partialFields: Record<string, BaseFieldBuilder<unknown>> = {};
  for (const [key, builder] of Object.entries(baseSchema._fields)) {
    // Clone the builder and make it optional
    const clonedBuilder = Object.create(Object.getPrototypeOf(builder));
    Object.assign(clonedBuilder, builder);
    clonedBuilder._required = false;
    partialFields[key] = clonedBuilder;
  }
  return schema(partialFields) as SchemaBuilder<Partial<T>>;
}

/**
 * Merge multiple schemas
 */
export function merge<
  T1 extends Record<string, unknown>,
  T2 extends Record<string, unknown>
>(
  schema1: SchemaBuilder<T1>,
  schema2: SchemaBuilder<T2>
): SchemaBuilder<T1 & T2> {
  return schema({
    ...schema1._fields,
    ...schema2._fields,
  }) as SchemaBuilder<T1 & T2>;
}

// ============================================================================
// Type Inference Helpers
// ============================================================================

/** Infer the type from a field builder */
type InferFieldBuilder<F> =
  F extends BaseFieldBuilder<infer T> ? T : never;

/** Infer the type from a record of field builders */
type InferFields<F extends Record<string, BaseFieldBuilder<unknown>>> = {
  [K in keyof F]: InferFieldBuilder<F[K]>;
};

/** Infer input type from a schema (what you pass to validate) */
export type InferInput<S> = S extends SchemaBuilder<infer T> ? T : never;

/** Infer output type from a schema (validated data) */
export type InferOutput<S> = S extends SchemaBuilder<infer T> ? T : never;

// ============================================================================
// Type Guards
// ============================================================================

function isSchemaBuilder<T extends Record<string, unknown>>(
  value: SchemaBuilder<T> | Record<string, BaseFieldBuilder<unknown>>
): value is SchemaBuilder<T> {
  return 'definition' in value && '_fields' in value;
}

// ============================================================================
// Field Factory
// ============================================================================

/**
 * Field factory for creating typed field builders
 */
export const field = {
  /**
   * Create a string field
   */
  string(): StringFieldBuilder {
    return new StringFieldBuilder();
  },

  /**
   * Create a number field
   */
  number(): NumberFieldBuilder {
    return new NumberFieldBuilder();
  },

  /**
   * Create a boolean field
   */
  boolean(): BooleanFieldBuilder {
    return new BooleanFieldBuilder();
  },

  /**
   * Create a date field
   */
  date(): DateFieldBuilder {
    return new DateFieldBuilder();
  },

  /**
   * Create an array field
   */
  array<T>(itemBuilder?: BaseFieldBuilder<T>): ArrayFieldBuilder<T> {
    return new ArrayFieldBuilder<T>(itemBuilder);
  },

  /**
   * Create a nested object field from a schema
   */
  object<T extends Record<string, unknown>>(
    schemaOrFields: SchemaBuilder<T> | Record<string, BaseFieldBuilder<unknown>>
  ): ObjectFieldBuilder<T> {
    if (isSchemaBuilder(schemaOrFields)) {
      return new ObjectFieldBuilder<T>(schemaOrFields._fields);
    }
    return new ObjectFieldBuilder<T>(schemaOrFields);
  },

  /**
   * Create an enum field (shorthand)
   */
  enum<E extends string>(values: readonly E[]): StringFieldBuilder {
    return new StringFieldBuilder().enum(values) as unknown as StringFieldBuilder;
  },
};
