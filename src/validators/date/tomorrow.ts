import type { ValidatorFn } from '../../types';
import { createError, isEmpty, parseDate } from '../utils';

export const tomorrowValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  const date = parseDate(value);
  if (!date) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() !== tomorrow.getTime()) {
    return createError(
      context,
      'INVALID_TOMORROW',
      message || 'Date must be tomorrow',
      soft
    );
  }

  return null;
};
