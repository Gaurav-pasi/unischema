import type { ValidatorFn } from '../../types';
import { createError, isEmpty, parseDate } from '../utils';

export const ageValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const min = params?.min as number | undefined;
  const max = params?.max as number | undefined;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  const birthDate = parseDate(value);
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (min !== undefined && age < min) {
    return createError(
      context,
      'INVALID_AGE_MIN',
      message || `Age must be at least ${min}`,
      soft
    );
  }

  if (max !== undefined && age > max) {
    return createError(
      context,
      'INVALID_AGE_MAX',
      message || `Age must be at most ${max}`,
      soft
    );
  }

  return null;
};
