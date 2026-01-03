import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

export const urlValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_URL', 'URL must be a string', soft);
  }

  try {
    new URL(value);
    return null;
  } catch {
    return createError(
      context,
      'INVALID_URL',
      message || 'Invalid URL format',
      soft
    );
  }
};
