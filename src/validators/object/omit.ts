import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isObject } from '../utils';

export const omitValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const forbiddenKeys = params?.keys as string[] | undefined;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isObject(value) || !forbiddenKeys) return null;

  const keys = Object.keys(value);
  const foundForbidden = keys.filter(key => forbiddenKeys.includes(key));

  if (foundForbidden.length > 0) {
    return createError(
      context,
      'INVALID_OMIT',
      message || `Forbidden keys found: ${foundForbidden.join(', ')}`,
      soft
    );
  }

  return null;
};
