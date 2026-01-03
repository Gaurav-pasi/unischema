import type { ValidatorFn } from '../../types';
import { createError, isEmpty, parseDate } from '../utils';

export const yesterdayValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  const date = parseDate(value);
  if (!date) return null;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() !== yesterday.getTime()) {
    return createError(
      context,
      'INVALID_YESTERDAY',
      message || 'Date must be yesterday',
      soft
    );
  }

  return null;
};
