import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isArray } from '../utils';

export const notEmptyValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isArray(value)) return null;

  if (value.length === 0) {
    return createError(
      context,
      'INVALID_NOT_EMPTY',
      message || 'Array must not be empty',
      soft
    );
  }

  return null;
};
