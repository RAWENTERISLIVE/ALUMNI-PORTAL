#!/usr/bin/env node

// Simple test script to debug API endpoints
const API_BASE = 'http://localhost:5000/api';

async function testEndpoint(method, endpoint, data = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    console.log(`\n🔍 Testing ${method} ${endpoint}`);
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    return { response, result };
  } catch (error) {
    console.error(`❌ Error testing ${method} ${endpoint}:`, error.message);
    return { error };
  }
}

async function runTests() {
  console.log('🚀 Testing Alumni Portal API Endpoints\n');
  
  // Test 1: Health check or auth endpoint
  console.log('=== Testing Authentication ===');
  await testEndpoint('POST', '/auth/login', {
    email: 'mpsajmer123@gmail.com',
    password: 'admin123'
  });
  
  // Test 2: Posts endpoint without auth
  console.log('\n=== Testing Posts (without auth) ===');
  await testEndpoint('GET', '/posts');
  
  // Test 3: Groups endpoint without auth
  console.log('\n=== Testing Groups (without auth) ===');
  await testEndpoint('GET', '/groups');
  
  console.log('\n✅ Basic API tests completed');
}

runTests().catch(console.error);
