import type { ValidatorFn } from '../../types';
import { createError, isEmpty } from '../utils';

export const dependsOnValidator: ValidatorFn = (value, params, context) => {
  if (isEmpty(value)) return null;

  const fieldName = params?.field as string | undefined;
  const soft = params?.soft as boolean;
  const message = params?.message as string | undefined;

  if (!fieldName) return null;

  const root = context.root as Record<string, unknown>;
  const otherValue = root?.[fieldName];

  if (isEmpty(otherValue)) {
    return createError(
      context,
      'INVALID_DEPENDS_ON',
      message || `This field requires ${fieldName} to be set`,
      soft
    );
  }

  return null;
};
