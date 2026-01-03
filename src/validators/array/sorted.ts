import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isArray } from '../utils';

export const sortedValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const order = (params?.order as 'asc' | 'desc') || 'asc';
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isArray(value)) return null;

  for (let i = 1; i < value.length; i++) {
    const prev = value[i - 1] as any;
    const curr = value[i] as any;

    if (order === 'asc') {
      if (prev > curr) {
        return createError(
          context,
          'INVALID_SORTED',
          message || 'Array must be sorted in ascending order',
          soft
        );
      }
    } else {
      if (prev < curr) {
        return createError(
          context,
          'INVALID_SORTED',
          message || 'Array must be sorted in descending order',
          soft
        );
      }
    }
  }

  return null;
};
