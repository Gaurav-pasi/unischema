import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const latitudeValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (value < -90 || value > 90) {
    return createError(
      context,
      'INVALID_LATITUDE',
      message || 'Latitude must be between -90 and 90',
      soft
    );
  }

  return null;
};
