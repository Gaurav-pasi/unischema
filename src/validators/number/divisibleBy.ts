import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const divisibleByValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const divisor = params?.divisor as number;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (value % divisor !== 0) {
    return createError(
      context,
      'INVALID_DIVISIBLE_BY',
      message || `Must be divisible by ${divisor}`,
      soft
    );
  }

  return null;
};
