import express from 'express';
import { validateBody } from 'unischema/backend';
import {
  UserRegistrationSchema,
  ProfileSchema,
  TransactionSchema,
  EdgeCasesSchema,
  URLSchema,
  SoftValidationSchema
} from './schemas.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for frontend testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Unischema Backend Test Server',
    endpoints: [
      'POST /api/register - User registration with basic validation',
      'POST /api/profile - Profile with nested objects',
      'POST /api/transaction - Transaction with soft validation',
      'POST /api/edge-cases - Edge case testing',
      'POST /api/urls - URL and pattern validation',
      'POST /api/soft-validation - Soft validation showcase'
    ]
  });
});

// Test Case 1: User Registration
app.post('/api/register', validateBody(UserRegistrationSchema), (req, res) => {
  const { validatedData, validationResult } = req;

  res.json({
    status: 'success',
    message: 'User registered successfully',
    data: validatedData,
    warnings: validationResult.softErrors.length > 0 ? validationResult.softErrors : undefined
  });
});

// Test Case 2: Profile with Nested Objects
app.post('/api/profile', validateBody(ProfileSchema), (req, res) => {
  const { validatedData, validationResult } = req;

  res.json({
    status: 'success',
    message: 'Profile saved successfully',
    data: validatedData,
    warnings: validationResult.softErrors.length > 0 ? validationResult.softErrors : undefined
  });
});

// Test Case 3: Transaction with Soft Validation
app.post('/api/transaction', validateBody(TransactionSchema), (req, res) => {
  const { validatedData, validationResult } = req;

  const response = {
    status: 'success',
    message: 'Transaction processed',
    data: validatedData
  };

  if (validationResult.softErrors.length > 0) {
    response.requiresReview = true;
    response.warnings = validationResult.softErrors;
    response.message = 'Transaction requires additional verification';
  }

  res.json(response);
});

// Test Case 4: Edge Cases
app.post('/api/edge-cases', validateBody(EdgeCasesSchema), (req, res) => {
  const { validatedData, validationResult } = req;

  res.json({
    status: 'success',
    message: 'Edge cases validated successfully',
    data: validatedData,
    warnings: validationResult.softErrors.length > 0 ? validationResult.softErrors : undefined
  });
});

// Test Case 5: URL and Pattern Validation
app.post('/api/urls', validateBody(URLSchema), (req, res) => {
  const { validatedData, validationResult } = req;

  res.json({
    status: 'success',
    message: 'URLs validated successfully',
    data: validatedData,
    warnings: validationResult.softErrors.length > 0 ? validationResult.softErrors : undefined
  });
});

// Test Case 6: Soft Validation Showcase
app.post('/api/soft-validation', validateBody(SoftValidationSchema), (req, res) => {
  const { validatedData, validationResult } = req;

  const hasWarnings = validationResult.softErrors.length > 0;

  res.json({
    status: 'success',
    message: hasWarnings ? 'Validation passed with warnings' : 'Validation passed',
    data: validatedData,
    warnings: hasWarnings ? validationResult.softErrors : undefined,
    securityScore: calculateSecurityScore(validationResult)
  });
});

// Helper function to calculate security score based on warnings
function calculateSecurityScore(validationResult) {
  const maxScore = 100;
  const warningPenalty = 10;
  const penalties = validationResult.softErrors.length * warningPenalty;
  return Math.max(0, maxScore - penalties);
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Unischema Backend Test Server running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/register`);
  console.log(`  POST http://localhost:${PORT}/api/profile`);
  console.log(`  POST http://localhost:${PORT}/api/transaction`);
  console.log(`  POST http://localhost:${PORT}/api/edge-cases`);
  console.log(`  POST http://localhost:${PORT}/api/urls`);
  console.log(`  POST http://localhost:${PORT}/api/soft-validation`);
});
