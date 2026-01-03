import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const portValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    return createError(
      context,
      'INVALID_PORT',
      message || 'Must be a valid port number (0-65535)',
      soft
    );
  }

  return null;
};
