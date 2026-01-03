import type { ValidatorFn } from '../../types';
import { createError, isEmpty, parseDate } from '../utils';

export const thisMonthValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  const date = parseDate(value);
  if (!date) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  if (date < startOfMonth || date > endOfMonth) {
    return createError(
      context,
      'INVALID_THIS_MONTH',
      message || 'Date must be within this month',
      soft
    );
  }

  return null;
};
