import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isNumber } from '../utils';

export const multipleOfValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const multiple = params?.multiple as number;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isNumber(value)) return null;

  if (value % multiple !== 0) {
    return createError(
      context,
      'INVALID_MULTIPLE_OF',
      message || `Must be a multiple of ${multiple}`,
      soft
    );
  }

  return null;
};
