import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isArray } from '../utils';

export const includesValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const item = params?.item;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isArray(value)) return null;

  if (!value.includes(item)) {
    return createError(
      context,
      'INVALID_INCLUDES',
      message || `Array must include ${JSON.stringify(item)}`,
      soft
    );
  }

  return null;
};
