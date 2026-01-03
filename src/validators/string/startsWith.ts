import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

export const startsWithValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const prefix = params?.prefix as string;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) return null;

  if (!value.startsWith(prefix)) {
    return createError(
      context,
      'INVALID_STARTS_WITH',
      message || `Must start with "${prefix}"`,
      soft
    );
  }

  return null;
};
