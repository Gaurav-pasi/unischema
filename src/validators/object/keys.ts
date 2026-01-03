import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isObject } from '../utils';

export const keysValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const pattern = params?.pattern as RegExp | undefined;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isObject(value)) return null;

  if (pattern) {
    const keys = Object.keys(value);
    const invalidKeys = keys.filter(key => !pattern.test(key));

    if (invalidKeys.length > 0) {
      return createError(
        context,
        'INVALID_KEYS',
        message || `Invalid keys: ${invalidKeys.join(', ')}`,
        soft
      );
    }
  }

  return null;
};
