import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isArray } from '../utils';

export const emptyValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isArray(value)) return null;

  if (value.length > 0) {
    return createError(
      context,
      'INVALID_EMPTY',
      message || 'Array must be empty',
      soft
    );
  }

  return null;
};
