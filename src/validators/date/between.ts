import type { ValidatorFn } from '../../types';
import { createError, isEmpty, parseDate } from '../utils';

export const betweenValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const start = params?.start;
  const end = params?.end;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  const date = parseDate(value);
  if (!date) return null;

  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (startDate && date < startDate) {
    return createError(
      context,
      'INVALID_DATE_BEFORE',
      message || `Date must be after ${startDate.toLocaleDateString()}`,
      soft
    );
  }

  if (endDate && date > endDate) {
    return createError(
      context,
      'INVALID_DATE_AFTER',
      message || `Date must be before ${endDate.toLocaleDateString()}`,
      soft
    );
  }

  return null;
};
