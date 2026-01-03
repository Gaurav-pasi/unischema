/**
 * Professional Test Suite for Unischema Backend
 * Tests all edge cases, validation scenarios, and error handling
 */

const API_BASE = 'http://localhost:3000/api';

// Test utilities
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, testFn) {
    try {
      await testFn();
      this.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      this.failed++;
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  async runAll() {
    console.log('\n🧪 Running Unischema Professional Test Suite\n');
    console.log('='.repeat(60));

    await this.testUserRegistration();
    await this.testProfileValidation();
    await this.testTransactionValidation();
    await this.testEdgeCases();
    await this.testURLValidation();
    await this.testSoftValidation();

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    console.log(`   Total: ${this.passed + this.failed} tests\n`);

    process.exit(this.failed > 0 ? 1 : 0);
  }

  async testUserRegistration() {
    console.log('\n📝 User Registration Tests');
    console.log('-'.repeat(60));

    // Valid registration
    await this.test('Valid user registration', async () => {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
          age: 25,
          username: 'test_user',
          acceptTerms: true
        })
      });
      const data = await response.json();
      if (response.status !== 200) throw new Error('Expected 200 status');
      if (data.status !== 'success') throw new Error('Expected success status');
    });

    // Underage user (soft validation)
    await this.test('Underage user triggers soft validation warning', async () => {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'minor@example.com',
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
          age: 16,
          username: 'minor_user',
          acceptTerms: true
        })
      });
      const data = await response.json();
      if (response.status !== 200) throw new Error('Should pass with warning');
      if (!data.warnings || data.warnings.length === 0) {
        throw new Error('Should have soft validation warnings');
      }
    });

    // Invalid email
    await this.test('Invalid email format rejected', async () => {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
          age: 25,
          username: 'test_user',
          acceptTerms: true
        })
      });
      if (response.status !== 400) throw new Error('Should reject invalid email');
    });

    // Password mismatch
    await this.test('Password mismatch rejected', async () => {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123',
          confirmPassword: 'DifferentPass456',
          age: 25,
          username: 'test_user',
          acceptTerms: true
        })
      });
      if (response.status !== 400) throw new Error('Should reject password mismatch');
    });

    // Short password
    await this.test('Short password rejected', async () => {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'short',
          confirmPassword: 'short',
          age: 25,
          username: 'test_user',
          acceptTerms: true
        })
      });
      if (response.status !== 400) throw new Error('Should reject short password');
    });

    // Invalid username pattern
    await this.test('Invalid username pattern rejected', async () => {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
          age: 25,
          username: 'invalid-name!',
          acceptTerms: true
        })
      });
      if (response.status !== 400) throw new Error('Should reject invalid username');
    });

    // Terms not accepted
    await this.test('Unaccepted terms rejected', async () => {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
          age: 25,
          username: 'test_user',
          acceptTerms: false
        })
      });
      if (response.status !== 400) throw new Error('Should reject when terms not accepted');
    });

    // Age too young
    await this.test('Age under 13 rejected', async () => {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'child@example.com',
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
          age: 10,
          username: 'child_user',
          acceptTerms: true
        })
      });
      if (response.status !== 400) throw new Error('Should reject age under 13');
    });
  }

  async testProfileValidation() {
    console.log('\n👤 Profile Validation Tests');
    console.log('-'.repeat(60));

    // Valid profile with nested object
    await this.test('Valid profile with nested address', async () => {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001'
          },
          phoneNumbers: ['555-123-4567']
        })
      });
      const data = await response.json();
      if (response.status !== 200) throw new Error('Expected 200 status');
      if (data.status !== 'success') throw new Error('Expected success');
    });

    // Multiple phone numbers
    await this.test('Multiple valid phone numbers', async () => {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001'
          },
          phoneNumbers: ['555-111-2222', '555-333-4444']
        })
      });
      if (response.status !== 200) throw new Error('Should accept multiple phones');
    });

    // Invalid ZIP code format
    await this.test('Invalid ZIP code rejected', async () => {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '123'
          },
          phoneNumbers: ['555-123-4567']
        })
      });
      if (response.status !== 400) throw new Error('Should reject invalid ZIP');
    });

    // Invalid state code
    await this.test('Invalid state code rejected', async () => {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NewYork',
            zipCode: '10001'
          },
          phoneNumbers: ['555-123-4567']
        })
      });
      if (response.status !== 400) throw new Error('Should reject invalid state');
    });

    // Too many phone numbers
    await this.test('Too many phone numbers rejected', async () => {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001'
          },
          phoneNumbers: ['555-111-1111', '555-222-2222', '555-333-3333', '555-444-4444']
        })
      });
      if (response.status !== 400) throw new Error('Should reject >3 phone numbers');
    });
  }

  async testTransactionValidation() {
    console.log('\n💳 Transaction Validation Tests');
    console.log('-'.repeat(60));

    // Normal transaction
    await this.test('Normal transaction processed', async () => {
      const response = await fetch(`${API_BASE}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 500,
          currency: 'USD',
          items: [
            { productId: 'PROD-001', quantity: 2, price: 250 }
          ],
          shippingDate: new Date(Date.now() + 86400000).toISOString()
        })
      });
      const data = await response.json();
      if (response.status !== 200) throw new Error('Should accept normal transaction');
      if (data.requiresReview) throw new Error('Should not require review');
    });

    // Large transaction (soft validation)
    await this.test('Large transaction triggers review', async () => {
      const response = await fetch(`${API_BASE}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 15000,
          currency: 'USD',
          items: [
            { productId: 'PROD-002', quantity: 1, price: 15000 }
          ],
          shippingDate: new Date(Date.now() + 86400000).toISOString()
        })
      });
      const data = await response.json();
      if (response.status !== 200) throw new Error('Should accept with warning');
      if (!data.requiresReview) throw new Error('Should require review');
    });

    // Negative amount rejected
    await this.test('Negative amount rejected', async () => {
      const response = await fetch(`${API_BASE}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: -100,
          currency: 'USD',
          items: [
            { productId: 'PROD-001', quantity: 1, price: -100 }
          ],
          shippingDate: new Date(Date.now() + 86400000).toISOString()
        })
      });
      if (response.status !== 400) throw new Error('Should reject negative amount');
    });

    // Invalid currency
    await this.test('Invalid currency rejected', async () => {
      const response = await fetch(`${API_BASE}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          currency: 'BTC',
          items: [
            { productId: 'PROD-001', quantity: 1, price: 100 }
          ],
          shippingDate: new Date(Date.now() + 86400000).toISOString()
        })
      });
      if (response.status !== 400) throw new Error('Should reject invalid currency');
    });

    // Past shipping date
    await this.test('Past shipping date rejected', async () => {
      const response = await fetch(`${API_BASE}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          currency: 'USD',
          items: [
            { productId: 'PROD-001', quantity: 1, price: 100 }
          ],
          shippingDate: new Date(Date.now() - 86400000).toISOString()
        })
      });
      if (response.status !== 400) throw new Error('Should reject past shipping date');
    });
  }

  async testEdgeCases() {
    console.log('\n⚠️  Edge Case Tests');
    console.log('-'.repeat(60));

    // Valid edge case data
    await this.test('All edge cases valid', async () => {
      const response = await fetch(`${API_BASE}/edge-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requiredString: 'test',
          positiveOnly: 5,
          negativeOnly: -5,
          integerOnly: 42,
          uniqueArray: ['a', 'b', 'c'],
          exactLength: ['x', 'y', 'z'],
          pastDate: new Date(Date.now() - 86400000).toISOString(),
          dateRange: new Date('2025-06-15').toISOString(),
          mustBeTrue: true,
          mustBeFalse: false
        })
      });
      if (response.status !== 200) throw new Error('Should accept valid edge cases');
    });

    // Empty required string
    await this.test('Empty required string rejected', async () => {
      const response = await fetch(`${API_BASE}/edge-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requiredString: '',
          positiveOnly: 5,
          negativeOnly: -5,
          integerOnly: 42,
          uniqueArray: ['a', 'b'],
          exactLength: ['x', 'y', 'z'],
          pastDate: new Date(Date.now() - 86400000).toISOString(),
          dateRange: new Date('2025-06-15').toISOString(),
          mustBeTrue: true,
          mustBeFalse: false
        })
      });
      if (response.status !== 400) throw new Error('Should reject empty string');
    });

    // Non-unique array
    await this.test('Non-unique array rejected', async () => {
      const response = await fetch(`${API_BASE}/edge-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requiredString: 'test',
          positiveOnly: 5,
          negativeOnly: -5,
          integerOnly: 42,
          uniqueArray: ['a', 'a', 'b'],
          exactLength: ['x', 'y', 'z'],
          pastDate: new Date(Date.now() - 86400000).toISOString(),
          dateRange: new Date('2025-06-15').toISOString(),
          mustBeTrue: true,
          mustBeFalse: false
        })
      });
      if (response.status !== 400) throw new Error('Should reject non-unique array');
    });

    // Wrong exact length
    await this.test('Wrong array length rejected', async () => {
      const response = await fetch(`${API_BASE}/edge-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requiredString: 'test',
          positiveOnly: 5,
          negativeOnly: -5,
          integerOnly: 42,
          uniqueArray: ['a', 'b', 'c'],
          exactLength: ['x', 'y'],
          pastDate: new Date(Date.now() - 86400000).toISOString(),
          dateRange: new Date('2025-06-15').toISOString(),
          mustBeTrue: true,
          mustBeFalse: false
        })
      });
      if (response.status !== 400) throw new Error('Should reject wrong length');
    });

    // Non-integer
    await this.test('Non-integer rejected', async () => {
      const response = await fetch(`${API_BASE}/edge-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requiredString: 'test',
          positiveOnly: 5,
          negativeOnly: -5,
          integerOnly: 42.5,
          uniqueArray: ['a', 'b', 'c'],
          exactLength: ['x', 'y', 'z'],
          pastDate: new Date(Date.now() - 86400000).toISOString(),
          dateRange: new Date('2025-06-15').toISOString(),
          mustBeTrue: true,
          mustBeFalse: false
        })
      });
      if (response.status !== 400) throw new Error('Should reject non-integer');
    });
  }

  async testURLValidation() {
    console.log('\n🌐 URL and Pattern Validation Tests');
    console.log('-'.repeat(60));

    // Valid URLs and patterns
    await this.test('Valid URLs and patterns', async () => {
      const response = await fetch(`${API_BASE}/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: 'https://example.com',
          slug: 'my-awesome-post',
          hexColor: '#FF5733',
          ipAddress: '192.168.1.1'
        })
      });
      if (response.status !== 200) throw new Error('Should accept valid URLs');
    });

    // Invalid URL
    await this.test('Invalid URL rejected', async () => {
      const response = await fetch(`${API_BASE}/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: 'not-a-url',
          slug: 'my-post',
          hexColor: '#FF5733',
          ipAddress: '192.168.1.1'
        })
      });
      if (response.status !== 400) throw new Error('Should reject invalid URL');
    });

    // Invalid hex color
    await this.test('Invalid hex color rejected', async () => {
      const response = await fetch(`${API_BASE}/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: 'https://example.com',
          slug: 'my-post',
          hexColor: 'red',
          ipAddress: '192.168.1.1'
        })
      });
      if (response.status !== 400) throw new Error('Should reject invalid hex');
    });

    // Invalid IP address
    await this.test('Invalid IP address rejected', async () => {
      const response = await fetch(`${API_BASE}/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: 'https://example.com',
          slug: 'my-post',
          hexColor: '#FF5733',
          ipAddress: '999.999.999.999'
        })
      });
      if (response.status !== 400) throw new Error('Should reject invalid IP');
    });
  }

  async testSoftValidation() {
    console.log('\n💡 Soft Validation Tests');
    console.log('-'.repeat(60));

    // Perfect score (no warnings)
    await this.test('Perfect security score', async () => {
      const response = await fetch(`${API_BASE}/soft-validation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'secure_user_123',
          password: 'VerySecurePassword123!',
          age: 30,
          purchaseAmount: 100
        })
      });
      const data = await response.json();
      if (response.status !== 200) throw new Error('Should pass');
      if (data.securityScore !== 100) throw new Error('Should have perfect score');
    });

    // With warnings (lower score)
    await this.test('Warnings reduce security score', async () => {
      const response = await fetch(`${API_BASE}/soft-validation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'user',
          password: 'short1',
          age: 16,
          purchaseAmount: 8000
        })
      });
      const data = await response.json();
      if (response.status !== 200) throw new Error('Should pass with warnings');
      if (!data.warnings || data.warnings.length === 0) {
        throw new Error('Should have warnings');
      }
      if (data.securityScore >= 100) throw new Error('Score should be reduced');
    });
  }
}

// Run tests
const runner = new TestRunner();
runner.runAll().catch(console.error);
