/**
 * Backend adapter exports
 */

// Express middleware
export {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  withValidation,
  sendValidationSuccess,
  sendValidationError,
  type ValidateRequestOptions,
  type ValidatedRequest,
} from './express';

// Generic handler (serverless)
export {
  createHandler,
  validateInput,
  success,
  error,
  type HandlerContext,
  type HandlerResult,
  type ValidatedHandler,
  type CreateHandlerOptions,
} from './handler';
