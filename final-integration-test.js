#!/usr/bin/env node

// Final Integration Test Suite
const API_BASE = 'http://localhost:8082/api';
const FRONTEND_BASE = 'http://localhost:8082';

// Color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, token = null, expectedStatus = 200) {
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
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    const success = response.status === expectedStatus;
    return { response, result, success };
  } catch (error) {
    return { error, success: false };
  }
}

async function testFrontendPage(path) {
  try {
    const response = await fetch(`${FRONTEND_BASE}${path}`);
    return { success: response.ok, status: response.status };
  } catch (error) {
    return { success: false, error };
  }
}

async function runFinalIntegrationTests() {
  log('🚀 Final Integration Test Suite', 'bold');
  log('='.repeat(50), 'blue');
  
  let passedTests = 0;
  let totalTests = 0;
  let adminToken = '';

  // Test 1: Frontend Loading
  log('\n📱 FRONTEND TESTS', 'magenta');
  totalTests++;
  const homeTest = await testFrontendPage('/');
  if (homeTest.success) {
    passedTests++;
    log('✅ Frontend home page loads', 'green');
  } else {
    log('❌ Frontend home page failed to load', 'red');
  }

  // Test 2: API Proxy
  totalTests++;
  const healthTest = await testEndpoint('GET', '/health');
  if (healthTest.success) {
    passedTests++;
    log('✅ API proxy working through frontend', 'green');
  } else {
    log('❌ API proxy failed', 'red');
  }

  // Test 3: Authentication Flow
  log('\n🔐 AUTHENTICATION FLOW', 'magenta');
  totalTests++;
  const loginTest = await testEndpoint('POST', '/auth/login', {
    email: 'mpsajmer123@gmail.com',
    password: 'bajmav-1qojmu-qoKkod'
  });
  
  if (loginTest.success && loginTest.result.accessToken) {
    adminToken = loginTest.result.accessToken;
    passedTests++;
    log('✅ Admin login successful', 'green');
  } else {
    log('❌ Admin login failed', 'red');
  }

  // Test 4: Core Features Integration
  log('\n🔧 CORE FEATURES INTEGRATION', 'magenta');
  
  if (adminToken) {
    // Posts
    totalTests++;
    const postsTest = await testEndpoint('GET', '/posts', null, adminToken);
    if (postsTest.success) {
      passedTests++;
      log('✅ Posts system working', 'green');
    } else {
      log('❌ Posts system failed', 'red');
    }

    // Events (newly implemented)
    totalTests++;
    const eventsTest = await testEndpoint('GET', '/events', null, adminToken);
    if (eventsTest.success) {
      passedTests++;
      log('✅ Events system working', 'green');
    } else {
      log('❌ Events system failed', 'red');
    }

    // Groups
    totalTests++;
    const groupsTest = await testEndpoint('GET', '/groups', null, adminToken);
    if (groupsTest.success) {
      passedTests++;
      log('✅ Groups system working', 'green');
    } else {
      log('❌ Groups system failed', 'red');
    }

    // Jobs
    totalTests++;
    const jobsTest = await testEndpoint('GET', '/jobs', null, adminToken);
    if (jobsTest.success) {
      passedTests++;
      log('✅ Jobs system working', 'green');
    } else {
      log('❌ Jobs system failed', 'red');
    }

    // Admin Features
    totalTests++;
    const adminTest = await testEndpoint('GET', '/users/stats', null, adminToken);
    if (adminTest.success) {
      passedTests++;
      log('✅ Admin features working', 'green');
    } else {
      log('❌ Admin features failed', 'red');
    }
  }

  // Test Results
  log('\n' + '='.repeat(50), 'blue');
  log('📊 FINAL INTEGRATION TEST RESULTS', 'bold');
  log('='.repeat(50), 'blue');
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`✅ Passed: ${passedTests}/${totalTests} tests (${successRate}%)`, 
      successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
  
  if (successRate >= 90) {
    log(`\n🎉 INTEGRATION TESTING COMPLETE - APPLICATION READY!`, 'green');
    log(`✅ All systems operational and ready for production use`, 'green');
  } else if (successRate >= 70) {
    log(`\n⚠️  Integration testing mostly successful with minor issues`, 'yellow');
    log(`🔧 Some features may need attention`, 'yellow');
  } else {
    log(`\n❌ Integration testing failed - major issues detected`, 'red');
    log(`🔧 Significant fixes required`, 'red');
  }
  
  log('\n🌐 Application URLs:', 'blue');
  log(`   Frontend: http://localhost:8082`, 'blue');
  log(`   Backend API: http://localhost:5000/api`, 'blue');
  log(`   Health Check: http://localhost:5000/api/health`, 'blue');
  
  log('\n👤 Test Credentials:', 'blue');
  log(`   Email: mpsajmer123@gmail.com`, 'blue');
  log(`   Password: bajmav-1qojmu-qoKkod`, 'blue');
  
  return { totalTests, passedTests, successRate: parseFloat(successRate) };
}

// Run the integration tests
runFinalIntegrationTests().then(results => {
  process.exit(results.successRate >= 90 ? 0 : 1);
}).catch(console.error);