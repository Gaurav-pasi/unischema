import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

// RFC 5322 simplified email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_EMAIL', 'Email must be a string', soft);
  }

  if (!EMAIL_REGEX.test(value)) {
    return createError(
      context,
      'INVALID_EMAIL',
      message || 'Invalid email address',
      soft
    );
  }

  return null;
};
