import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const safeValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (!Number.isSafeInteger(value)) {
    return createError(
      context,
      'INVALID_SAFE_INTEGER',
      message || 'Must be a safe integer',
      soft
    );
  }

  return null;
};
