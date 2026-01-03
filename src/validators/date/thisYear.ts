import type { ValidatorFn } from '../../types';
import { createError, isEmpty, parseDate } from '../utils';

export const thisYearValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  const date = parseDate(value);
  if (!date) return null;

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  if (date < startOfYear || date > endOfYear) {
    return createError(
      context,
      'INVALID_THIS_YEAR',
      message || 'Date must be within this year',
      soft
    );
  }

  return null;
};
