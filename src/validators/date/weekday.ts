import type { ValidatorFn } from '../../types';
import { createError, isEmpty, parseDate } from '../utils';

export const weekdayValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  const date = parseDate(value);
  if (!date) return null;

  const day = date.getDay();
  if (day === 0 || day === 6) {
    return createError(
      context,
      'INVALID_WEEKDAY',
      message || 'Date must be a weekday',
      soft
    );
  }

  return null;
};
