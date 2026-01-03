import type { ValidatorFn } from '../../types';
import { createError, isEmpty } from '../utils';

export const notMatchesValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const fieldName = params?.field as string | undefined;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!fieldName) return null;

  const root = context.root as Record<string, unknown>;
  const otherValue = root?.[fieldName];

  if (value === otherValue) {
    return createError(
      context,
      'INVALID_NOT_MATCHES',
      message || `Must not match ${fieldName}`,
      soft
    );
  }

  return null;
};
