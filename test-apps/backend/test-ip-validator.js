/**
 * Comprehensive IP Address Validator Test Suite
 * Tests the new .ipAddress() method with extensive edge cases
 */

const API_BASE = 'http://localhost:3000/api';

class IPValidatorTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
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
    console.log('\n🧪 Comprehensive IP Address Validator Test Suite\n');
    console.log('='.repeat(70));

    await this.testValidIPAddresses();
    await this.testInvalidIPAddresses();
    await this.testEdgeCases();
    await this.testBoundaryValues();

    console.log('\n' + '='.repeat(70));
    console.log(`\n📊 IP Validator Test Results: ${this.passed} passed, ${this.failed} failed`);
    console.log(`   Total: ${this.passed + this.failed} tests\n`);

    process.exit(this.failed > 0 ? 1 : 0);
  }

  async testValidIPAddresses() {
    console.log('\n✅ Valid IP Addresses');
    console.log('-'.repeat(70));

    const validIPs = [
      '0.0.0.0',
      '1.1.1.1',
      '8.8.8.8',
      '127.0.0.1',
      '192.168.0.1',
      '192.168.1.1',
      '10.0.0.1',
      '172.16.0.1',
      '255.255.255.255',
      '1.2.3.4',
      '192.168.100.100',
      '10.10.10.10',
      '172.31.255.255',
      '100.64.0.0',
      '198.18.0.0',
    ];

    for (const ip of validIPs) {
      await this.test(`Valid IP: ${ip}`, async () => {
        const response = await fetch(`${API_BASE}/urls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            website: 'https://example.com',
            slug: 'test-post',
            hexColor: '#FF5733',
            ipAddress: ip
          })
        });
        if (response.status !== 200) {
          const data = await response.json();
          throw new Error(`Should accept valid IP ${ip}. Response: ${JSON.stringify(data)}`);
        }
      });
    }
  }

  async testInvalidIPAddresses() {
    console.log('\n❌ Invalid IP Addresses (Should Be Rejected)');
    console.log('-'.repeat(70));

    const invalidIPs = [
      { ip: '256.1.1.1', reason: 'First octet > 255' },
      { ip: '1.256.1.1', reason: 'Second octet > 255' },
      { ip: '1.1.256.1', reason: 'Third octet > 255' },
      { ip: '1.1.1.256', reason: 'Fourth octet > 255' },
      { ip: '999.999.999.999', reason: 'All octets > 255' },
      { ip: '300.168.1.1', reason: 'First octet = 300' },
      { ip: '192.300.1.1', reason: 'Second octet = 300' },
      { ip: '192.168.300.1', reason: 'Third octet = 300' },
      { ip: '192.168.1.300', reason: 'Fourth octet = 300' },
      { ip: '1.1.1', reason: 'Only 3 octets' },
      { ip: '1.1.1.1.1', reason: '5 octets' },
      { ip: 'a.b.c.d', reason: 'Letters instead of numbers' },
      { ip: '192.168.1', reason: 'Missing fourth octet' },
      { ip: '192.168', reason: 'Only 2 octets' },
      { ip: '192', reason: 'Only 1 octet' },
      { ip: '', reason: 'Empty string' },
      { ip: '...', reason: 'Only dots' },
      { ip: '1.1.1.1.', reason: 'Trailing dot' },
      { ip: '.1.1.1.1', reason: 'Leading dot' },
      { ip: '1..1.1.1', reason: 'Double dot' },
      { ip: '1.1.1.-1', reason: 'Negative number' },
      { ip: '01.02.03.04', reason: 'Leading zeros (debatable)' },
      { ip: 'localhost', reason: 'Hostname not IP' },
      { ip: '192.168.1.1/24', reason: 'CIDR notation' },
      { ip: '192.168.1.1:8080', reason: 'Port included' },
      { ip: ' 192.168.1.1', reason: 'Leading space' },
      { ip: '192.168.1.1 ', reason: 'Trailing space' },
      { ip: '192 .168.1.1', reason: 'Space in middle' },
    ];

    for (const { ip, reason } of invalidIPs) {
      await this.test(`Invalid IP: ${ip} (${reason})`, async () => {
        const response = await fetch(`${API_BASE}/urls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            website: 'https://example.com',
            slug: 'test-post',
            hexColor: '#FF5733',
            ipAddress: ip
          })
        });
        if (response.status !== 400) {
          const data = await response.json();
          throw new Error(`Should reject invalid IP: ${ip} (${reason}). Got status: ${response.status}`);
        }
      });
    }
  }

  async testEdgeCases() {
    console.log('\n⚠️  Edge Cases');
    console.log('-'.repeat(70));

    // Test with undefined/null (should be handled gracefully if field is optional)
    await this.test('Empty IP when required should be rejected', async () => {
      const response = await fetch(`${API_BASE}/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: 'https://example.com',
          slug: 'test-post',
          hexColor: '#FF5733',
          ipAddress: ''
        })
      });
      if (response.status !== 400) {
        throw new Error('Should reject empty IP when required');
      }
    });

    // Test special IP addresses that are technically valid
    const specialIPs = [
      { ip: '0.0.0.0', name: 'All zeros (any address)' },
      { ip: '255.255.255.255', name: 'Broadcast address' },
      { ip: '127.0.0.1', name: 'Localhost' },
      { ip: '224.0.0.1', name: 'Multicast address' },
      { ip: '169.254.1.1', name: 'Link-local address' },
    ];

    for (const { ip, name } of specialIPs) {
      await this.test(`Special IP accepted: ${ip} (${name})`, async () => {
        const response = await fetch(`${API_BASE}/urls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            website: 'https://example.com',
            slug: 'test-post',
            hexColor: '#FF5733',
            ipAddress: ip
          })
        });
        if (response.status !== 200) {
          throw new Error(`Should accept special IP: ${ip} (${name})`);
        }
      });
    }
  }

  async testBoundaryValues() {
    console.log('\n🎯 Boundary Value Testing');
    console.log('-'.repeat(70));

    const boundaryTests = [
      { ip: '0.0.0.0', valid: true, name: 'Minimum value' },
      { ip: '255.255.255.255', valid: true, name: 'Maximum value' },
      { ip: '0.0.0.1', valid: true, name: 'Min + 1' },
      { ip: '255.255.255.254', valid: true, name: 'Max - 1' },
      { ip: '128.128.128.128', valid: true, name: 'Middle value' },
      { ip: '255.0.0.0', valid: true, name: 'Max first octet' },
      { ip: '0.255.0.0', valid: true, name: 'Max second octet' },
      { ip: '0.0.255.0', valid: true, name: 'Max third octet' },
      { ip: '0.0.0.255', valid: true, name: 'Max fourth octet' },
      { ip: '256.0.0.0', valid: false, name: 'Max + 1 first octet' },
      { ip: '0.256.0.0', valid: false, name: 'Max + 1 second octet' },
      { ip: '0.0.256.0', valid: false, name: 'Max + 1 third octet' },
      { ip: '0.0.0.256', valid: false, name: 'Max + 1 fourth octet' },
    ];

    for (const { ip, valid, name } of boundaryTests) {
      await this.test(`Boundary: ${ip} (${name}) - ${valid ? 'Valid' : 'Invalid'}`, async () => {
        const response = await fetch(`${API_BASE}/urls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            website: 'https://example.com',
            slug: 'test-post',
            hexColor: '#FF5733',
            ipAddress: ip
          })
        });

        const expectedStatus = valid ? 200 : 400;
        if (response.status !== expectedStatus) {
          const data = await response.json();
          throw new Error(
            `Expected status ${expectedStatus} for ${ip} (${name}), got ${response.status}. ` +
            `Response: ${JSON.stringify(data)}`
          );
        }
      });
    }
  }
}

// Run tests
const runner = new IPValidatorTestRunner();
runner.runAll().catch(console.error);
