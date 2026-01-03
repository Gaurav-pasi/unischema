import type { ValidatorFn } from '../../types';
import { createError, isEmpty, parseDate } from '../utils';

export const todayValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  const date = parseDate(value);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() !== today.getTime()) {
    return createError(
      context,
      'INVALID_TODAY',
      message || 'Date must be today',
      soft
    );
  }

  return null;
};
