import type { ValidatorFn } from '../../types';
import { createError, isEmpty, parseDate } from '../utils';

export const weekendValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  const date = parseDate(value);
  if (!date) return null;

  const day = date.getDay();
  if (day !== 0 && day !== 6) {
    return createError(
      context,
      'INVALID_WEEKEND',
      message || 'Date must be a weekend',
      soft
    );
  }

  return null;
};
