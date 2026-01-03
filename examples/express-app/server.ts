/**
 * Express.js Backend Example
 *
 * This demonstrates how to use FormSchema for backend validation.
 * The same schemas are shared with the frontend.
 */

import express, { Request, Response } from 'express';
import {
  validateBody,
  withValidation,
  sendValidationSuccess,
  type ValidatedRequest,
} from '../../src/adapters/backend';
import {
  UserRegistrationSchema,
  UserProfileSchema,
  TransactionSchema,
  ContactFormSchema,
  OrderSchema,
  type UserRegistrationInput,
  type TransactionInput,
} from '../shared-schemas';

const app = express();
app.use(express.json());

// ============================================================================
// Example 1: Simple Middleware Usage
// ============================================================================

app.post(
  '/api/register',
  validateBody(UserRegistrationSchema),
  (req: ValidatedRequest<UserRegistrationInput>, res: Response) => {
    // At this point, req.validatedData is fully typed and validated
    const { email, name, age } = req.validatedData;

    // Check for soft warnings
    if (req.validationResult.softErrors.length > 0) {
      console.log('Warnings:', req.validationResult.softErrors);
    }

    // Simulate user creation
    const user = {
      id: `user_${Date.now()}`,
      email,
      name,
      age,
      createdAt: new Date().toISOString(),
    };

    sendValidationSuccess(res, user, 'User registered successfully');
  }
);

// ============================================================================
// Example 2: Using withValidation Helper
// ============================================================================

app.post(
  '/api/transactions',
  ...withValidation(
    TransactionSchema,
    async (req: ValidatedRequest<TransactionInput>, res: Response) => {
      const { amount, currency, accountId, category } = req.validatedData;

      // Check for soft warnings (e.g., large transaction warning)
      const warnings = req.validationResult.softErrors;
      const requiresReview = warnings.some((w) => w.field === 'amount');

      // Simulate transaction processing
      const transaction = {
        id: `txn_${Date.now()}`,
        amount,
        currency,
        accountId,
        category,
        status: requiresReview ? 'pending_review' : 'completed',
        warnings: warnings.map((w) => w.message),
        createdAt: new Date().toISOString(),
      };

      sendValidationSuccess(res, transaction, 'Transaction processed');
    }
  )
);

// ============================================================================
// Example 3: Profile Update (Partial Validation)
// ============================================================================

app.patch(
  '/api/profile',
  validateBody(UserProfileSchema),
  (req: Request, res: Response) => {
    const validatedReq = req as ValidatedRequest<Record<string, unknown>>;

    // Only validated fields are in validatedData
    const updates = validatedReq.validatedData;

    // Simulate profile update
    res.json({
      status: 'success',
      data: {
        message: 'Profile updated',
        updatedFields: Object.keys(updates),
      },
      errors: [],
      msg: 'Success',
      validation: {
        hard_validations: [],
        soft_validations: validatedReq.validationResult.softErrors,
      },
    });
  }
);

// ============================================================================
// Example 4: Contact Form with Warnings
// ============================================================================

app.post(
  '/api/contact',
  validateBody(ContactFormSchema),
  (req: Request, res: Response) => {
    const validatedReq = req as ValidatedRequest<Record<string, unknown>>;
    const data = validatedReq.validatedData;

    // Simulate sending email
    const ticket = {
      id: `ticket_${Date.now()}`,
      ...data,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    sendValidationSuccess(res, ticket, 'Message sent successfully');
  }
);

// ============================================================================
// Example 5: Order with Nested Validation
// ============================================================================

app.post(
  '/api/orders',
  validateBody(OrderSchema),
  (req: Request, res: Response) => {
    const validatedReq = req as ValidatedRequest<Record<string, unknown>>;
    const orderData = validatedReq.validatedData as Record<string, unknown>;

    // Calculate totals
    const items = orderData.items as Array<{
      quantity: number;
      unitPrice: number;
    }>;
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const order = {
      id: `order_${Date.now()}`,
      ...orderData,
      subtotal,
      tax: subtotal * 0.08,
      total: subtotal * 1.08,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    sendValidationSuccess(res, order, 'Order created successfully');
  }
);

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 3000;

// Only start if this is the main module
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  POST /api/register     - User registration');
    console.log('  POST /api/transactions - Create transaction');
    console.log('  PATCH /api/profile     - Update profile');
    console.log('  POST /api/contact      - Contact form');
    console.log('  POST /api/orders       - Create order');
    console.log('  GET  /health           - Health check');
  });
}

export { app };
