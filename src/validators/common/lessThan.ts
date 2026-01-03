import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const lessThanValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const fieldName = params?.field as string | undefined;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value) || !fieldName) return null;

  const root = context.root as Record<string, unknown>;
  const otherValue = root?.[fieldName];

  if (isNumber(otherValue) && value >= otherValue) {
    return createError(
      context,
      'INVALID_LESS_THAN',
      message || `Must be less than ${fieldName}`,
      soft
    );
  }

  return null;
};
