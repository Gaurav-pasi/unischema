import type { ValidatorFn } from '../../types';

export const whenValidator: ValidatorFn = (value, params, context) => {
  const fieldName = params?.field as string | undefined;
  const is = params?.is;
  const then = params?.then as ValidatorFn | undefined;

  if (!fieldName || !then) return null;

  const root = context.root as Record<string, unknown>;
  const otherValue = root?.[fieldName];

  // Only apply 'then' validator if condition matches
  if (otherValue === is) {
    return then(value, params, context);
  }

  return null;
};
