import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

const NUMERIC_REGEX = /^[0-9]+$/;

export const numericValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_NUMERIC', 'Value must be a string', soft);
  }

  if (!NUMERIC_REGEX.test(value)) {
    return createError(
      context,
      'INVALID_NUMERIC',
      message || 'Must contain only numbers',
      soft
    );
  }

  return null;
};
