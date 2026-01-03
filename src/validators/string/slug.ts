import type { ValidatorFn } from '../../types';
import { createError, isEmpty, isString } from '../utils';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!isString(value)) {
    return createError(context, 'INVALID_SLUG', 'Slug must be a string', soft);
  }

  if (!SLUG_REGEX.test(value)) {
    return createError(
      context,
      'INVALID_SLUG',
      message || 'Must be a valid URL slug (lowercase, numbers, hyphens)',
      soft
    );
  }

  return null;
};
