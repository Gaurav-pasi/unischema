import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const betweenValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const min = params?.min as number;
  const max = params?.max as number;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (value < min || value > max) {
    return createError(
      context,
      'INVALID_BETWEEN',
      message || `Must be between ${min} and ${max}`,
      soft
    );
  }

  return null;
};
