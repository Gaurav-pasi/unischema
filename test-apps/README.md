# Unischema Test Applications

Comprehensive test suite for the `unischema` package with both backend and frontend applications.

## Overview

This test suite includes:
- **Backend**: Express.js server with 6 different validation endpoints
- **Frontend**: Interactive web application with real-time validation
- **Test Suite**: Automated tests covering all edge cases

## Test Cases Covered

### 1. User Registration
- Email validation
- Password strength and matching
- Age validation with soft warnings (under 18)
- Username pattern validation
- Terms acceptance (boolean validation)

### 2. Nested Objects (Profile)
- Nested address object validation
- State code pattern (2 uppercase letters)
- ZIP code pattern validation
- Phone number array (1-3 items, specific format)

### 3. Transaction with Soft Validation
- Amount validation with soft warning for large transactions (>$10,000)
- Currency enum validation
- Future date validation
- Optional notes field with max length

### 4. URL and Pattern Validation
- URL format validation
- Slug pattern (lowercase, numbers, hyphens)
- Hex color pattern (#RRGGBB)
- IP address pattern validation

### 5. Edge Cases
- Empty string vs undefined
- Positive/negative number validation
- Integer validation
- Unique array validation
- Exact array length
- Past/future date validation
- Boolean true/false validation

### 6. Soft Validation Showcase
- Security scoring based on validation warnings
- Username length recommendations
- Password strength recommendations
- Age-based warnings
- Purchase amount warnings

## Setup and Installation

### Backend

```bash
cd test-apps/backend
npm install
npm start
```

The backend server will run on `http://localhost:3000`

### Frontend

```bash
cd test-apps/frontend
npm install
npx http-server -p 8080
```

The frontend will be available at `http://localhost:8080`

## Running Tests

### Backend Automated Tests

```bash
cd test-apps/backend
npm start  # In one terminal
npm test   # In another terminal
```

The test suite includes:
- ✅ 40+ automated test cases
- ✅ All validation scenarios
- ✅ Edge case coverage
- ✅ Error handling tests
- ✅ Soft validation tests

### Frontend Manual Testing

1. Start the backend server
2. Open the frontend in your browser
3. Test each form with valid and invalid data
4. Check real-time validation on blur
5. Verify soft validation warnings
6. Monitor the statistics panel

## Test Endpoints

### POST /api/register
Tests basic validation, password matching, age soft validation

**Valid Request:**
```json
{
  "email": "test@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "age": 25,
  "username": "test_user",
  "acceptTerms": true
}
```

### POST /api/profile
Tests nested object and array validation

**Valid Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "phoneNumbers": ["555-123-4567"]
}
```

### POST /api/transaction
Tests soft validation for large amounts

**Valid Request:**
```json
{
  "amount": 500,
  "currency": "USD",
  "items": [
    { "productId": "PROD-001", "quantity": 2, "price": 250 }
  ],
  "shippingDate": "2026-01-10T00:00:00.000Z"
}
```

### POST /api/urls
Tests URL and pattern validation

**Valid Request:**
```json
{
  "website": "https://example.com",
  "slug": "my-awesome-post",
  "hexColor": "#FF5733",
  "ipAddress": "192.168.1.1"
}
```

### POST /api/edge-cases
Tests edge cases and special validations

**Valid Request:**
```json
{
  "requiredString": "test",
  "optionalEmail": "optional@example.com",
  "positiveOnly": 5,
  "negativeOnly": -5,
  "integerOnly": 42,
  "uniqueArray": ["a", "b", "c"],
  "exactLength": ["x", "y", "z"],
  "pastDate": "2025-01-01T00:00:00.000Z",
  "dateRange": "2025-06-15T00:00:00.000Z",
  "mustBeTrue": true,
  "mustBeFalse": false
}
```

### POST /api/soft-validation
Tests soft validation with security scoring

**Valid Request:**
```json
{
  "username": "secure_user_123",
  "password": "VerySecurePassword123!",
  "age": 30,
  "purchaseAmount": 100
}
```

## Features Demonstrated

### Hard Validation (Blocking)
- Required fields
- Type validation
- Format validation (email, URL, patterns)
- Min/max constraints
- Enum validation
- Field matching (password confirmation)

### Soft Validation (Warnings)
- Age warnings (under 18)
- Transaction amount warnings (over $10,000)
- Username/password strength recommendations
- Senior citizen age warnings
- Large purchase warnings

### Advanced Features
- Nested object validation
- Array validation with min/max length
- Unique array items
- Exact array length
- Date range validation
- Past/future date validation
- Integer validation
- Positive/negative number validation
- Pattern matching with regex
- Optional fields with validation when present

## Expected Test Results

When running the automated test suite, you should see:

```
🧪 Running Unischema Professional Test Suite
============================================================

📝 User Registration Tests
------------------------------------------------------------
✅ Valid user registration
✅ Underage user triggers soft validation warning
✅ Invalid email format rejected
✅ Password mismatch rejected
✅ Short password rejected
✅ Invalid username pattern rejected
✅ Unaccepted terms rejected
✅ Age under 13 rejected

👤 Profile Validation Tests
------------------------------------------------------------
✅ Valid profile with nested address
✅ Multiple valid phone numbers
✅ Invalid ZIP code rejected
✅ Invalid state code rejected
✅ Too many phone numbers rejected

💳 Transaction Validation Tests
------------------------------------------------------------
✅ Normal transaction processed
✅ Large transaction triggers review
✅ Negative amount rejected
✅ Invalid currency rejected
✅ Past shipping date rejected

⚠️  Edge Case Tests
------------------------------------------------------------
✅ All edge cases valid
✅ Empty required string rejected
✅ Non-unique array rejected
✅ Wrong array length rejected
✅ Non-integer rejected

🌐 URL and Pattern Validation Tests
------------------------------------------------------------
✅ Valid URLs and patterns
✅ Invalid URL rejected
✅ Invalid hex color rejected
✅ Invalid IP address rejected

💡 Soft Validation Tests
------------------------------------------------------------
✅ Perfect security score
✅ Warnings reduce security score

============================================================

📊 Test Results: 40+ passed, 0 failed
   Total: 40+ tests
```

## Troubleshooting

### Backend won't start
- Make sure port 3000 is available
- Check that `unischema` is installed: `npm install`

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check CORS settings (already configured)
- Verify API_BASE URL in `app.js`

### Module import errors
- Make sure you're using a proper HTTP server (not file://)
- Use `npx http-server` or similar
- Check that paths in imports are correct

## License

MIT
