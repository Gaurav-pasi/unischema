import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

export const endsWithValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const suffix = params?.suffix as string;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) return null;

  if (!value.endsWith(suffix)) {
    return createError(
      context,
      'INVALID_ENDS_WITH',
      message || `Must end with "${suffix}"`,
      soft
    );
  }

  return null;
};
