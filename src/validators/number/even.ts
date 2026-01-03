import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const evenValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (value % 2 !== 0) {
    return createError(
      context,
      'INVALID_EVEN',
      message || 'Must be an even number',
      soft
    );
  }

  return null;
};
