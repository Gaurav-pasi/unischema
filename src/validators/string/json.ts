import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

export const jsonValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_JSON', 'JSON value must be a string', soft);
  }

  try {
    JSON.parse(value);
    return null;
  } catch {
    return createError(
      context,
      'INVALID_JSON',
      message || 'Must be valid JSON',
      soft
    );
  }
};
