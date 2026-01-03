import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export const base64Validator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_BASE64', 'Base64 value must be a string', soft);
  }

  if (!BASE64_REGEX.test(value)) {
    return createError(
      context,
      'INVALID_BASE64',
      message || 'Must be a valid base64 string',
      soft
    );
  }

  return null;
};
