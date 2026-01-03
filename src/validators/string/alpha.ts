import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

const ALPHA_REGEX = /^[a-zA-Z]+$/;

export const alphaValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_ALPHA', 'Value must be a string', soft);
  }

  if (!ALPHA_REGEX.test(value)) {
    return createError(
      context,
      'INVALID_ALPHA',
      message || 'Must contain only letters',
      soft
    );
  }

  return null;
};
