import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

export const lengthValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const length = params?.length as number;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) return null;

  if (value.length !== length) {
    return createError(
      context,
      'INVALID_LENGTH',
      message || `Must be exactly ${length} characters`,
      soft
    );
  }

  return null;
};
