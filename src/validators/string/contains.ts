import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

export const containsValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const substring = params?.substring as string;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) return null;

  if (!value.includes(substring)) {
    return createError(
      context,
      'INVALID_CONTAINS',
      message || `Must contain "${substring}"`,
      soft
    );
  }

  return null;
};
