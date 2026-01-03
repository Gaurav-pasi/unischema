import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const oddValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (value % 2 === 0) {
    return createError(
      context,
      'INVALID_ODD',
      message || 'Must be an odd number',
      soft
    );
  }

  return null;
};
