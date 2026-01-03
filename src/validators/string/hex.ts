import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

const HEX_REGEX = /^(0x)?[0-9a-fA-F]+$/;

export const hexValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_HEX', 'Hex value must be a string', soft);
  }

  if (!HEX_REGEX.test(value)) {
    return createError(
      context,
      'INVALID_HEX',
      message || 'Must be a valid hexadecimal string',
      soft
    );
  }

  return null;
};
