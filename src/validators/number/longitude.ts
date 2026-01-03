import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const longitudeValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (value < -180 || value > 180) {
    return createError(
      context,
      'INVALID_LONGITUDE',
      message || 'Longitude must be between -180 and 180',
      soft
    );
  }

  return null;
};
