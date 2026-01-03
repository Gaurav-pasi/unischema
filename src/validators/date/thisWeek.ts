import type { ValidatorFn } from '../../types';
import { createError, isEmpty, parseDate } from '../utils';

export const thisWeekValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  const date = parseDate(value);
  if (!date) return null;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  if (date < startOfWeek || date > endOfWeek) {
    return createError(
      context,
      'INVALID_THIS_WEEK',
      message || 'Date must be within this week',
      soft
    );
  }

  return null;
};
