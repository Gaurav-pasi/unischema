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
 * Make all fields optional recursively (deep partial)
 */
export function deepPartial<T extends Record<string, unknown>>(
  baseSchema: SchemaBuilder<T>
): SchemaBuilder<DeepPartial<T>> {
  const deepPartialFields: Record<string, BaseFieldBuilder<unknown>> = {};
  for (const [key, builder] of Object.entries(baseSchema._fields)) {
    const clonedBuilder = Object.create(Object.getPrototypeOf(builder));
    Object.assign(clonedBuilder, builder);
    clonedBuilder._required = false;

    // Handle nested objects
    if (builder instanceof ObjectFieldBuilder) {
      const fieldDef = builder.build();
      if (fieldDef.schema) {
        // Recursively apply deep partial to nested schema
        const nestedFields: Record<string, BaseFieldBuilder<unknown>> = {};
        for (const [nestedKey, nestedDef] of Object.entries(fieldDef.schema.fields)) {
          // Create a builder from the field definition
          const nestedBuilder = Object.create(BaseFieldBuilder.prototype);
          Object.assign(nestedBuilder, {
            _type: nestedDef.type,
            _rules: nestedDef.rules || [],
            _required: false, // Make optional
            _defaultValue: nestedDef.defaultValue,
            _meta: nestedDef.meta || {},
            _transforms: nestedDef.transforms || [],
            _preprocess: nestedDef.preprocess,
            _nullable: nestedDef.nullable || false,
            _nullish: nestedDef.nullish || false,
          });
          nestedFields[nestedKey] = nestedBuilder;
        }
        // Create deep partial of nested schema
        const nestedSchema = schema(nestedFields);
        const deepNestedSchema = deepPartial(nestedSchema);
        clonedBuilder._schema = deepNestedSchema.definition;
      }
    }

    deepPartialFields[key] = clonedBuilder;
  }
  return schema(deepPartialFields) as SchemaBuilder<DeepPartial<T>>;
}

/**
 * Allow unknown keys to pass through
 */
export function passthrough<T extends Record<string, unknown>>(
  baseSchema: SchemaBuilder<T>
): SchemaBuilder<T> {
  const result = schema(baseSchema._fields) as SchemaBuilder<T>;
  result.definition.passthrough = true;
  return result;
}

/**
 * Strict mode - reject unknown keys
 */
export function strict<T extends Record<string, unknown>>(
  baseSchema: SchemaBuilder<T>
): SchemaBuilder<T> {
  const result = schema(baseSchema._fields) as SchemaBuilder<T>;
  result.definition.strict = true;
  return result;
}

/**
 * Default handler for unknown keys (catchall)
 */
export function catchall<T extends Record<string, unknown>>(
  baseSchema: SchemaBuilder<T>,
  fieldBuilder: BaseFieldBuilder<unknown>
): SchemaBuilder<T> {
  const result = schema(baseSchema._fields) as SchemaBuilder<T>;
  result.definition.catchall = fieldBuilder.build();
  return result;
}

/**
 * Make specific fields required
 */
export function required<
  T extends Record<string, unknown>,
  K extends keyof T
>(
  baseSchema: SchemaBuilder<T>,
  keys: K[]
): SchemaBuilder<T> {
  const keySet = new Set(keys as string[]);
  const newFields: Record<string, BaseFieldBuilder<unknown>> = {};

  for (const [key, builder] of Object.entries(baseSchema._fields)) {
    if (keySet.has(key)) {
      const clonedBuilder = Object.create(Object.getPrototypeOf(builder));
      Object.assign(clonedBuilder, builder);
      clonedBuilder._required = true;
      newFields[key] = clonedBuilder;
    } else {
      newFields[key] = builder;
    }
  }

  return schema(newFields) as SchemaBuilder<T>;
}

/**
 * Make specific fields optional
 */
export function optional<
  T extends Record<string, unknown>,
  K extends keyof T
>(
  baseSchema: SchemaBuilder<T>,
  keys: K[]
): SchemaBuilder<T> {
  const keySet = new Set(keys as string[]);
  const newFields: Record<string, BaseFieldBuilder<unknown>> = {};

  for (const [key, builder] of Object.entries(baseSchema._fields)) {
    if (keySet.has(key)) {
      const clonedBuilder = Object.create(Object.getPrototypeOf(builder));
      Object.assign(clonedBuilder, builder);
      clonedBuilder._required = false;
      newFields[key] = clonedBuilder;
    } else {
      newFields[key] = builder;
    }
  }

  return schema(newFields) as SchemaBuilder<T>;
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

/** Deep partial type helper */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

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
