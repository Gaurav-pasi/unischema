/**
 * Fluent field builder for schema definitions
 */

import type { FieldDefinition, ValidationRule, ValidatorContext } from '../types';

// ============================================================================
// Base Field Builder
// ============================================================================

export class BaseFieldBuilder<T> {
  protected _type: FieldDefinition['type'];
  protected _rules: ValidationRule[] = [];
  protected _required: boolean = false;
  protected _defaultValue?: T;
  protected _meta: Record<string, unknown> = {};

  constructor(type: FieldDefinition['type']) {
    this._type = type;
  }

  /**
   * Mark field as required
   */
  required(message?: string): this {
    this._required = true;
    if (message) {
      this._rules.push({ type: 'required', message });
    }
    return this;
  }

  /**
   * Mark field as optional (default)
   */
  optional(): this {
    this._required = false;
    return this;
  }

  /**
   * Set default value
   */
  default(value: T): this {
    this._defaultValue = value;
    return this;
  }

  /**
   * Add custom validation
   */
  custom(
    validate: (value: unknown, context: ValidatorContext) => { valid: boolean; message?: string } | boolean,
    message?: string
  ): this {
    this._rules.push({
      type: 'custom',
      params: { validate },
      message,
    });
    return this;
  }

  /**
   * Add a soft (warning) custom validation
   */
  softCustom(
    validate: (value: unknown, context: ValidatorContext) => { valid: boolean; message?: string } | boolean,
    message?: string
  ): this {
    this._rules.push({
      type: 'custom',
      params: { validate },
      message,
      soft: true,
    });
    return this;
  }

  /**
   * Add field metadata
   */
  meta(data: Record<string, unknown>): this {
    this._meta = { ...this._meta, ...data };
    return this;
  }

  /**
   * Field must not match another field
   */
  notMatches(field: string, message?: string): this {
    this._rules.push({
      type: 'notMatches',
      params: { field },
      message,
    });
    return this;
  }

  /**
   * Field must be greater than another field (for numbers)
   */
  greaterThan(field: string, message?: string): this {
    this._rules.push({
      type: 'greaterThan',
      params: { field },
      message,
    });
    return this;
  }

  /**
   * Field must be less than another field (for numbers)
   */
  lessThan(field: string, message?: string): this {
    this._rules.push({
      type: 'lessThan',
      params: { field },
      message,
    });
    return this;
  }

  /**
   * Field depends on another field being set
   */
  dependsOn(field: string, message?: string): this {
    this._rules.push({
      type: 'dependsOn',
      params: { field },
      message,
    });
    return this;
  }

  /**
   * Build the field definition
   */
  build(): FieldDefinition<T> {
    return {
      type: this._type,
      rules: [...this._rules],
      required: this._required,
      defaultValue: this._defaultValue,
      meta: Object.keys(this._meta).length > 0 ? this._meta : undefined,
    };
  }
}

// ============================================================================
// String Field Builder
// ============================================================================

export class StringFieldBuilder extends BaseFieldBuilder<string> {
  constructor() {
    super('string');
  }

  /**
   * Minimum length
   */
  min(length: number, message?: string): this {
    this._rules.push({
      type: 'min',
      params: { value: length },
      message,
    });
    return this;
  }

  /**
   * Minimum length (soft validation - warning only)
   */
  minSoft(length: number, message?: string): this {
    this._rules.push({
      type: 'min',
      params: { value: length },
      message,
      soft: true,
    });
    return this;
  }

  /**
   * Maximum length
   */
  max(length: number, message?: string): this {
    this._rules.push({
      type: 'max',
      params: { value: length },
      message,
    });
    return this;
  }

  /**
   * Maximum length (soft validation - warning only)
   */
  maxSoft(length: number, message?: string): this {
    this._rules.push({
      type: 'max',
      params: { value: length },
      message,
      soft: true,
    });
    return this;
  }

  /**
   * Validate as email
   */
  email(message?: string): this {
    this._rules.push({
      type: 'email',
      message,
    });
    return this;
  }

  /**
   * Validate as URL
   */
  url(message?: string): this {
    this._rules.push({
      type: 'url',
      message,
    });
    return this;
  }

  /**
   * Validate as IP address (IPv4)
   */
  ipAddress(message?: string): this {
    this._rules.push({
      type: 'ipAddress',
      message,
    });
    return this;
  }

  /**
   * Validate as IPv6 address
   */
  ipv6(message?: string): this {
    this._rules.push({
      type: 'ipv6',
      message,
    });
    return this;
  }

  /**
   * Only alphabetic characters (a-zA-Z)
   */
  alpha(message?: string): this {
    this._rules.push({
      type: 'alpha',
      message,
    });
    return this;
  }

  /**
   * Only alphanumeric characters (a-zA-Z0-9)
   */
  alphanumeric(message?: string): this {
    this._rules.push({
      type: 'alphanumeric',
      message,
    });
    return this;
  }

  /**
   * Only numeric digits
   */
  numeric(message?: string): this {
    this._rules.push({
      type: 'numeric',
      message,
    });
    return this;
  }

  /**
   * Must be lowercase
   */
  lowercase(message?: string): this {
    this._rules.push({
      type: 'lowercase',
      message,
    });
    return this;
  }

  /**
   * Must be uppercase
   */
  uppercase(message?: string): this {
    this._rules.push({
      type: 'uppercase',
      message,
    });
    return this;
  }

  /**
   * URL-friendly slug (lowercase, alphanumeric, hyphens)
   */
  slug(message?: string): this {
    this._rules.push({
      type: 'slug',
      message,
    });
    return this;
  }

  /**
   * Hexadecimal string
   */
  hex(message?: string): this {
    this._rules.push({
      type: 'hex',
      message,
    });
    return this;
  }

  /**
   * Base64 encoded string
   */
  base64(message?: string): this {
    this._rules.push({
      type: 'base64',
      message,
    });
    return this;
  }

  /**
   * Valid JSON string
   */
  json(message?: string): this {
    this._rules.push({
      type: 'json',
      message,
    });
    return this;
  }

  /**
   * Exact length
   */
  length(len: number, message?: string): this {
    this._rules.push({
      type: 'length',
      params: { length: len },
      message,
    });
    return this;
  }

  /**
   * Must contain substring
   */
  contains(substring: string, message?: string): this {
    this._rules.push({
      type: 'contains',
      params: { substring },
      message,
    });
    return this;
  }

  /**
   * Must start with prefix
   */
  startsWith(prefix: string, message?: string): this {
    this._rules.push({
      type: 'startsWith',
      params: { prefix },
      message,
    });
    return this;
  }

  /**
   * Must end with suffix
   */
  endsWith(suffix: string, message?: string): this {
    this._rules.push({
      type: 'endsWith',
      params: { suffix },
      message,
    });
    return this;
  }

  /**
   * Match a regex pattern
   */
  pattern(regex: RegExp | string, message?: string): this {
    const pattern = typeof regex === 'string' ? regex : regex.source;
    this._rules.push({
      type: 'pattern',
      params: { pattern },
      message,
    });
    return this;
  }

  /**
   * Must be one of specified values
   */
  enum<E extends string>(values: readonly E[], message?: string): EnumFieldBuilder<E> {
    const builder = new EnumFieldBuilder<E>(values, this._rules, this._required, this._meta);
    builder.addEnumRule(values, message);
    return builder;
  }

  /**
   * Must match another field
   */
  matches(field: string, message?: string): this {
    this._rules.push({
      type: 'matches',
      params: { field },
      message,
    });
    return this;
  }

  /**
   * Add a soft validation (warning only)
   */
  soft(message: string): this {
    // Adds a custom soft validation that always passes but shows a warning
    this._rules.push({
      type: 'custom',
      params: {
        validate: () => ({ valid: true }),
      },
      message,
      soft: true,
    });
    return this;
  }
}

// ============================================================================
// Enum Field Builder
// ============================================================================

export class EnumFieldBuilder<E extends string> extends BaseFieldBuilder<E> {
  private _values: readonly E[];

  constructor(
    values: readonly E[],
    rules: ValidationRule[] = [],
    required: boolean = false,
    meta: Record<string, unknown> = {}
  ) {
    super('string');
    this._values = values;
    this._rules = [...rules];
    this._required = required;
    this._meta = { ...meta };
  }

  /**
   * Add enum validation rule (internal use)
   */
  addEnumRule(values: readonly E[], message?: string): void {
    this._rules.push({
      type: 'enum',
      params: { values },
      message,
    });
  }

  /**
   * Get the allowed values
   */
  get values(): readonly E[] {
    return this._values;
  }

  build(): FieldDefinition<E> {
    return {
      type: this._type,
      rules: [...this._rules],
      required: this._required,
      defaultValue: this._defaultValue,
      meta: {
        ...this._meta,
        enumValues: this._values,
      },
    };
  }
}

// ============================================================================
// Number Field Builder
// ============================================================================

export class NumberFieldBuilder extends BaseFieldBuilder<number> {
  constructor() {
    super('number');
  }

  /**
   * Minimum value
   */
  min(value: number, message?: string): this {
    this._rules.push({
      type: 'min',
      params: { value },
      message,
    });
    return this;
  }

  /**
   * Minimum value (soft validation - warning only)
   */
  minSoft(value: number, message?: string): this {
    this._rules.push({
      type: 'min',
      params: { value },
      message,
      soft: true,
    });
    return this;
  }

  /**
   * Maximum value
   */
  max(value: number, message?: string): this {
    this._rules.push({
      type: 'max',
      params: { value },
      message,
    });
    return this;
  }

  /**
   * Maximum value (soft validation - warning only)
   */
  maxSoft(value: number, message?: string): this {
    this._rules.push({
      type: 'max',
      params: { value },
      message,
      soft: true,
    });
    return this;
  }

  /**
   * Must be an integer
   */
  integer(message?: string): this {
    this._rules.push({
      type: 'integer',
      message,
    });
    return this;
  }

  /**
   * Must be positive
   */
  positive(message?: string): this {
    this._rules.push({
      type: 'positive',
      message,
    });
    return this;
  }

  /**
   * Must be negative
   */
  negative(message?: string): this {
    this._rules.push({
      type: 'negative',
      message,
    });
    return this;
  }

  /**
   * Must be a valid port number (0-65535)
   */
  port(message?: string): this {
    this._rules.push({
      type: 'port',
      message,
    });
    return this;
  }

  /**
   * Must be a valid latitude (-90 to 90)
   */
  latitude(message?: string): this {
    this._rules.push({
      type: 'latitude',
      message,
    });
    return this;
  }

  /**
   * Must be a valid longitude (-180 to 180)
   */
  longitude(message?: string): this {
    this._rules.push({
      type: 'longitude',
      message,
    });
    return this;
  }

  /**
   * Must be a percentage (0-100)
   */
  percentage(message?: string): this {
    this._rules.push({
      type: 'percentage',
      message,
    });
    return this;
  }

  /**
   * Must be between min and max (inclusive)
   */
  between(min: number, max: number, message?: string): this {
    this._rules.push({
      type: 'numberBetween',
      params: { min, max },
      message,
    });
    return this;
  }

  /**
   * Must be divisible by a number
   */
  divisibleBy(divisor: number, message?: string): this {
    this._rules.push({
      type: 'divisibleBy',
      params: { divisor },
      message,
    });
    return this;
  }

  /**
   * Must be a multiple of a number
   */
  multipleOf(multiple: number, message?: string): this {
    this._rules.push({
      type: 'multipleOf',
      params: { multiple },
      message,
    });
    return this;
  }

  /**
   * Must be an even number
   */
  even(message?: string): this {
    this._rules.push({
      type: 'even',
      message,
    });
    return this;
  }

  /**
   * Must be an odd number
   */
  odd(message?: string): this {
    this._rules.push({
      type: 'odd',
      message,
    });
    return this;
  }

  /**
   * Must be a safe integer
   */
  safe(message?: string): this {
    this._rules.push({
      type: 'safe',
      message,
    });
    return this;
  }

  /**
   * Must be a finite number
   */
  finite(message?: string): this {
    this._rules.push({
      type: 'finite',
      message,
    });
    return this;
  }

  /**
   * Add a soft validation with message
   */
  soft(message: string): this {
    this._rules.push({
      type: 'custom',
      params: {
        validate: () => ({ valid: false, message }),
      },
      message,
      soft: true,
    });
    return this;
  }

  /**
   * Soft minimum value (warning only)
   */
  warnBelow(value: number, message?: string): this {
    return this.minSoft(value, message);
  }

  /**
   * Soft maximum value (warning only)
   */
  warnAbove(value: number, message?: string): this {
    return this.maxSoft(value, message);
  }
}

// ============================================================================
// Boolean Field Builder
// ============================================================================

export class BooleanFieldBuilder extends BaseFieldBuilder<boolean> {
  constructor() {
    super('boolean');
  }

  /**
   * Must be true
   */
  isTrue(message?: string): this {
    this._rules.push({
      type: 'custom',
      params: {
        validate: (value: unknown) => value === true,
      },
      message: message || 'Must be true',
    });
    return this;
  }

  /**
   * Must be false
   */
  isFalse(message?: string): this {
    this._rules.push({
      type: 'custom',
      params: {
        validate: (value: unknown) => value === false,
      },
      message: message || 'Must be false',
    });
    return this;
  }
}

// ============================================================================
// Date Field Builder
// ============================================================================

export class DateFieldBuilder extends BaseFieldBuilder<Date> {
  constructor() {
    super('date');
  }

  /**
   * Must be after a specific date
   */
  after(date: Date | string, message?: string): this {
    const threshold = typeof date === 'string' ? new Date(date) : date;
    this._rules.push({
      type: 'custom',
      params: {
        validate: (value: unknown) => {
          if (!(value instanceof Date) && typeof value !== 'string') return false;
          const d = value instanceof Date ? value : new Date(value);
          return d > threshold;
        },
      },
      message: message || `Must be after ${threshold.toISOString()}`,
    });
    return this;
  }

  /**
   * Must be before a specific date
   */
  before(date: Date | string, message?: string): this {
    const threshold = typeof date === 'string' ? new Date(date) : date;
    this._rules.push({
      type: 'custom',
      params: {
        validate: (value: unknown) => {
          if (!(value instanceof Date) && typeof value !== 'string') return false;
          const d = value instanceof Date ? value : new Date(value);
          return d < threshold;
        },
      },
      message: message || `Must be before ${threshold.toISOString()}`,
    });
    return this;
  }

  /**
   * Must be in the past
   */
  past(message?: string): this {
    this._rules.push({
      type: 'custom',
      params: {
        validate: (value: unknown) => {
          if (!(value instanceof Date) && typeof value !== 'string') return false;
          const d = value instanceof Date ? value : new Date(value);
          return d < new Date();
        },
      },
      message: message || 'Must be a past date',
    });
    return this;
  }

  /**
   * Must be in the future
   */
  future(message?: string): this {
    this._rules.push({
      type: 'custom',
      params: {
        validate: (value: unknown) => {
          if (!(value instanceof Date) && typeof value !== 'string') return false;
          const d = value instanceof Date ? value : new Date(value);
          return d > new Date();
        },
      },
      message: message || 'Must be a future date',
    });
    return this;
  }

  /**
   * Must be today
   */
  today(message?: string): this {
    this._rules.push({
      type: 'today',
      message,
    });
    return this;
  }

  /**
   * Must be yesterday
   */
  yesterday(message?: string): this {
    this._rules.push({
      type: 'yesterday',
      message,
    });
    return this;
  }

  /**
   * Must be tomorrow
   */
  tomorrow(message?: string): this {
    this._rules.push({
      type: 'tomorrow',
      message,
    });
    return this;
  }

  /**
   * Must be within this week
   */
  thisWeek(message?: string): this {
    this._rules.push({
      type: 'thisWeek',
      message,
    });
    return this;
  }

  /**
   * Must be within this month
   */
  thisMonth(message?: string): this {
    this._rules.push({
      type: 'thisMonth',
      message,
    });
    return this;
  }

  /**
   * Must be within this year
   */
  thisYear(message?: string): this {
    this._rules.push({
      type: 'thisYear',
      message,
    });
    return this;
  }

  /**
   * Must be a weekday
   */
  weekday(message?: string): this {
    this._rules.push({
      type: 'weekday',
      message,
    });
    return this;
  }

  /**
   * Must be a weekend
   */
  weekend(message?: string): this {
    this._rules.push({
      type: 'weekend',
      message,
    });
    return this;
  }

  /**
   * Validate age is within range
   */
  age(min?: number, max?: number, message?: string): this {
    this._rules.push({
      type: 'age',
      params: { min, max },
      message,
    });
    return this;
  }

  /**
   * Must be between two dates
   */
  between(start: Date | string, end: Date | string, message?: string): this {
    this._rules.push({
      type: 'dateBetween',
      params: { start, end },
      message,
    });
    return this;
  }
}

// ============================================================================
// Array Field Builder
// ============================================================================

export class ArrayFieldBuilder<T> extends BaseFieldBuilder<T[]> {
  private _itemDef?: FieldDefinition;

  constructor(itemBuilder?: BaseFieldBuilder<T>) {
    super('array');
    if (itemBuilder) {
      this._itemDef = itemBuilder.build();
    }
  }

  /**
   * Minimum items
   */
  min(count: number, message?: string): this {
    this._rules.push({
      type: 'min',
      params: { value: count },
      message,
    });
    return this;
  }

  /**
   * Maximum items
   */
  max(count: number, message?: string): this {
    this._rules.push({
      type: 'max',
      params: { value: count },
      message,
    });
    return this;
  }

  /**
   * Exactly N items
   */
  length(count: number, message?: string): this {
    this._rules.push({
      type: 'custom',
      params: {
        validate: (value: unknown) => {
          if (!Array.isArray(value)) return false;
          return value.length === count;
        },
      },
      message: message || `Must have exactly ${count} items`,
    });
    return this;
  }

  /**
   * All items must be unique
   */
  unique(message?: string): this {
    this._rules.push({
      type: 'custom',
      params: {
        validate: (value: unknown) => {
          if (!Array.isArray(value)) return true;
          const set = new Set(value.map((v) => JSON.stringify(v)));
          return set.size === value.length;
        },
      },
      message: message || 'All items must be unique',
    });
    return this;
  }

  /**
   * Must include a specific item
   */
  includes(item: T, message?: string): this {
    this._rules.push({
      type: 'includes',
      params: { item },
      message,
    });
    return this;
  }

  /**
   * Must not include a specific item
   */
  excludes(item: T, message?: string): this {
    this._rules.push({
      type: 'excludes',
      params: { item },
      message,
    });
    return this;
  }

  /**
   * Must be empty
   */
  empty(message?: string): this {
    this._rules.push({
      type: 'empty',
      message,
    });
    return this;
  }

  /**
   * Must not be empty
   */
  notEmpty(message?: string): this {
    this._rules.push({
      type: 'notEmpty',
      message,
    });
    return this;
  }

  /**
   * Must be sorted
   */
  sorted(order: 'asc' | 'desc' = 'asc', message?: string): this {
    this._rules.push({
      type: 'sorted',
      params: { order },
      message,
    });
    return this;
  }

  /**
   * Must not contain falsy values
   */
  compact(message?: string): this {
    this._rules.push({
      type: 'compact',
      message,
    });
    return this;
  }

  build(): FieldDefinition<T[]> {
    return {
      type: this._type,
      rules: [...this._rules],
      required: this._required,
      defaultValue: this._defaultValue,
      items: this._itemDef,
      meta: Object.keys(this._meta).length > 0 ? this._meta : undefined,
    };
  }
}

// ============================================================================
// Object Field Builder (for nested schemas)
// ============================================================================

export class ObjectFieldBuilder<T extends Record<string, unknown>> extends BaseFieldBuilder<T> {
  private _schema: { fields: Record<string, FieldDefinition> };

  constructor(schemaFields: Record<string, BaseFieldBuilder<unknown>>) {
    super('object');
    this._schema = {
      fields: Object.fromEntries(
        Object.entries(schemaFields).map(([key, builder]) => [key, builder.build()])
      ),
    };
  }

  build(): FieldDefinition<T> {
    return {
      type: this._type,
      rules: [...this._rules],
      required: this._required,
      defaultValue: this._defaultValue,
      schema: this._schema,
      meta: Object.keys(this._meta).length > 0 ? this._meta : undefined,
    };
  }
}
