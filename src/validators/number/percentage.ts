import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const percentageValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (value < 0 || value > 100) {
    return createError(
      context,
      'INVALID_PERCENTAGE',
      message || 'Percentage must be between 0 and 100',
      soft
    );
  }

  return null;
};
