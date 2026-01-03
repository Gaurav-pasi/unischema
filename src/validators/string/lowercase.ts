import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

export const lowercaseValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_LOWERCASE', 'Value must be a string', soft);
  }

  if (value !== value.toLowerCase()) {
    return createError(
      context,
      'INVALID_LOWERCASE',
      message || 'Must be lowercase',
      soft
    );
  }

  return null;
};
