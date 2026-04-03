/**
 * Safety Profile Encryption Test
 * 
 * Run this to verify encryption/decryption works correctly
 */

import {
  encryptString,
  decryptString,
  encryptStringArray,
  decryptStringArray,
  testEncryption,
} from '../lib/crypto/safetyEncryption';

async function runTests() {
  console.log('=== Safety Profile Encryption Tests ===\n');
  
  const testUserId = 'test-user-123';
  
  // Test 1: Basic string encryption/decryption
  console.log('Test 1: Basic string encryption...');
  try {
    const plaintext = 'John Doe';
    const encrypted = await encryptString(plaintext, testUserId);
    console.log('✓ Encrypted:', encrypted?.substring(0, 50) + '...');
    
    const decrypted = await decryptString(encrypted, testUserId);
    console.log('✓ Decrypted:', decrypted);
    
    if (decrypted === plaintext) {
      console.log('✅ Test 1 PASSED\n');
    } else {
      console.error('❌ Test 1 FAILED: Decrypted text does not match\n');
    }
  } catch (error) {
    console.error('❌ Test 1 FAILED:', error, '\n');
  }
  
  // Test 2: Array encryption/decryption
  console.log('Test 2: Array encryption...');
  try {
    const array = ['Peanuts', 'Shellfish', 'Dairy'];
    const encrypted = await encryptStringArray(array, testUserId);
    console.log('✓ Encrypted array:', encrypted?.substring(0, 50) + '...');
    
    const decrypted = await decryptStringArray(encrypted, testUserId);
    console.log('✓ Decrypted array:', decrypted);
    
    if (JSON.stringify(decrypted) === JSON.stringify(array)) {
      console.log('✅ Test 2 PASSED\n');
    } else {
      console.error('❌ Test 2 FAILED: Decrypted array does not match\n');
    }
  } catch (error) {
    console.error('❌ Test 2 FAILED:', error, '\n');
  }
  
  // Test 3: Null handling
  console.log('Test 3: Null handling...');
  try {
    const encrypted = await encryptString(null, testUserId);
    if (encrypted === null) {
      console.log('✅ Test 3 PASSED: Null input returns null\n');
    } else {
      console.error('❌ Test 3 FAILED: Null input should return null\n');
    }
  } catch (error) {
    console.error('❌ Test 3 FAILED:', error, '\n');
  }
  
  // Test 4: Empty string handling
  console.log('Test 4: Empty string handling...');
  try {
    const encrypted = await encryptString('', testUserId);
    if (encrypted === null) {
      console.log('✅ Test 4 PASSED: Empty string returns null\n');
    } else {
      console.error('❌ Test 4 FAILED: Empty string should return null\n');
    }
  } catch (error) {
    console.error('❌ Test 4 FAILED:', error, '\n');
  }
  
  // Test 5: Built-in test function
  console.log('Test 5: Running built-in encryption test...');
  const testResult = await testEncryption(testUserId);
  if (testResult) {
    console.log('✅ Test 5 PASSED\n');
  } else {
    console.error('❌ Test 5 FAILED\n');
  }
  
  console.log('=== All Tests Complete ===');
}

// Run tests
runTests().catch(console.error);
