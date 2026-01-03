import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isArray } from '../utils';

export const compactValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isArray(value)) return null;

  const hasFalsy = value.some(item => !item);

  if (hasFalsy) {
    return createError(
      context,
      'INVALID_COMPACT',
      message || 'Array must not contain falsy values',
      soft
    );
  }

  return null;
};
