import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

// IPv4 with proper octet range (0-255)
const IPV4_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const ipAddressValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_IP', 'IP address must be a string', soft);
  }

  if (!IPV4_REGEX.test(value)) {
    return createError(
      context,
      'INVALID_IP',
      message || 'Invalid IP address format',
      soft
    );
  }

  return null;
};
