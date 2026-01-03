import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const finiteValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (!Number.isFinite(value)) {
    return createError(
      context,
      'INVALID_FINITE',
      message || 'Must be a finite number',
      soft
    );
  }

  return null;
};
