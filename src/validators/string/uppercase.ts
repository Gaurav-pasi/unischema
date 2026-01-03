import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

export const uppercaseValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_UPPERCASE', 'Value must be a string', soft);
  }

  if (value !== value.toUpperCase()) {
    return createError(
      context,
      'INVALID_UPPERCASE',
      message || 'Must be uppercase',
      soft
    );
  }

  return null;
};
