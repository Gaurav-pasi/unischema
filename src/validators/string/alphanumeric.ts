import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

export const alphanumericValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_ALPHANUMERIC', 'Value must be a string', soft);
  }

  if (!ALPHANUMERIC_REGEX.test(value)) {
    return createError(
      context,
      'INVALID_ALPHANUMERIC',
      message || 'Must contain only letters and numbers',
      soft
    );
  }

  return null;
};
