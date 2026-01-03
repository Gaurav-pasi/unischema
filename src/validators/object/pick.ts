import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isObject } from '../utils';

export const pickValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const allowedKeys = params?.keys as string[] | undefined;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isObject(value) || !allowedKeys) return null;

  const keys = Object.keys(value);
  const extraKeys = keys.filter(key => !allowedKeys.includes(key));

  if (extraKeys.length > 0) {
    return createError(
      context,
      'INVALID_PICK',
      message || `Unexpected keys: ${extraKeys.join(', ')}`,
      soft
    );
  }

  return null;
};
