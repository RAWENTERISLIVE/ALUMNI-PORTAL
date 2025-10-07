#!/usr/bin/env node

// Comprehensive Backend API Test Suite
const API_BASE = 'http://localhost:5000/api';
let adminToken = '';

// Color codes for terminal output
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
    
    log(`\n🔍 Testing ${method} ${endpoint}`, 'cyan');
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    const status = response.status === expectedStatus ? '✅' : '❌';
    log(`${status} Status: ${response.status} (expected: ${expectedStatus})`, 
        response.status === expectedStatus ? 'green' : 'red');
    
    if (response.status !== expectedStatus) {
      log(`❌ Unexpected response:`, 'red');
      console.log(JSON.stringify(result, null, 2));
    } else {
      log(`✅ Success: ${result.message || 'OK'}`, 'green');
    }
    
    return { response, result, success: response.status === expectedStatus };
  } catch (error) {
    log(`❌ Error testing ${method} ${endpoint}: ${error.message}`, 'red');
    return { error, success: false };
  }
}

async function runComprehensiveTests() {
  log('🚀 Starting Comprehensive Backend API Tests', 'bold');
  log('='.repeat(60), 'blue');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Health Check
  log('\n📋 PHASE 1: SYSTEM HEALTH CHECKS', 'magenta');
  totalTests++;
  const healthTest = await testEndpoint('GET', '/health');
  if (healthTest.success) passedTests++;
  
  // Test 2: Admin Authentication
  log('\n📋 PHASE 2: AUTHENTICATION TESTS', 'magenta');
  totalTests++;
  const loginTest = await testEndpoint('POST', '/auth/login', {
    email: 'mpsajmer123@gmail.com',
    password: 'bajmav-1qojmu-qoKkod'
  });
  
  if (loginTest.success && loginTest.result.accessToken) {
    adminToken = loginTest.result.accessToken;
    passedTests++;
    log(`🔐 Admin token acquired`, 'green');
  } else {
    log(`❌ Failed to get admin token - many tests will fail`, 'red');
  }
  
  // Test 3: User Profile
  if (adminToken) {
    totalTests++;
    const profileTest = await testEndpoint('GET', '/users/me', null, adminToken);
    if (profileTest.success) passedTests++;
  }
  
  // Test 4: User Registration (should work without token)
  totalTests++;
  const registrationTest = await testEndpoint('POST', '/auth/register', {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123',
    admissionNumber: `${Math.floor(Math.random() * 10000)}/24`,
    admissionYear: '2024'
  }, null, 201);
  if (registrationTest.success) passedTests++;
  
  // Test 5: Posts System
  log('\n📋 PHASE 3: CONTENT MANAGEMENT TESTS', 'magenta');
  if (adminToken) {
    // Get posts
    totalTests++;
    const getPostsTest = await testEndpoint('GET', '/posts', null, adminToken);
    if (getPostsTest.success) passedTests++;
    
    // Create post
    totalTests++;
    const createPostTest = await testEndpoint('POST', '/posts', {
      title: 'Test Post',
      content: 'This is a test post content',
      audience: 'public'
    }, adminToken, 201);
    if (createPostTest.success) passedTests++;
  }
  
  // Test 6: Jobs System
  if (adminToken) {
    // Get jobs
    totalTests++;
    const getJobsTest = await testEndpoint('GET', '/jobs', null, adminToken);
    if (getJobsTest.success) passedTests++;
    
    // Create job
    totalTests++;
    const createJobTest = await testEndpoint('POST', '/jobs', {
      title: 'Test Job Position',
      company: 'Test Company',
      location: 'Remote',
      type: 'full-time',
      description: 'This is a test job description',
      requirements: ['Test requirement'],
      salary: { min: 50000, max: 80000, currency: 'USD' }
    }, adminToken, 201);
    if (createJobTest.success) passedTests++;
  }
  
  // Test 7: Groups System
  if (adminToken) {
    // Get groups
    totalTests++;
    const getGroupsTest = await testEndpoint('GET', '/groups', null, adminToken);
    if (getGroupsTest.success) passedTests++;
    
    // Create group
    totalTests++;
    const createGroupTest = await testEndpoint('POST', '/groups', {
      name: 'Test Group',
      description: 'This is a test group',
      privacy: 'public',
      category: 'professional'
    }, adminToken, 201);
    if (createGroupTest.success) passedTests++;
  }
  
  // Test 8: Events System
  if (adminToken) {
    // Get events
    totalTests++;
    const getEventsTest = await testEndpoint('GET', '/events', null, adminToken);
    if (getEventsTest.success) passedTests++;
    
    // Create event
    totalTests++;
    const createEventTest = await testEndpoint('POST', '/events', {
      title: 'Test Event',
      description: 'This is a test event',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      time: '10:00 AM',
      location: 'Test Location',
      category: 'networking',
      isSchoolEvent: false
    }, adminToken, 201);
    if (createEventTest.success) passedTests++;
  }
  
  // Test 9: Mentorship System
  if (adminToken) {
    // Get mentorship profiles
    totalTests++;
    const getMentorshipTest = await testEndpoint('GET', '/mentorship', null, adminToken);
    if (getMentorshipTest.success) passedTests++;
  }
  
  // Test 10: Admin Features
  log('\n📋 PHASE 4: ADMIN FUNCTIONALITY TESTS', 'magenta');
  if (adminToken) {
    // Get user stats
    totalTests++;
    const getStatsTest = await testEndpoint('GET', '/users/stats', null, adminToken);
    if (getStatsTest.success) passedTests++;
    
    // Get alumni directory
    totalTests++;
    const getDirectoryTest = await testEndpoint('GET', '/users/directory', null, adminToken);
    if (getDirectoryTest.success) passedTests++;
    
    // Get reports (admin moderation)
    totalTests++;
    const getReportsTest = await testEndpoint('GET', '/reports', null, adminToken);
    if (getReportsTest.success) passedTests++;
  }
  
  // Test 11: Connections System
  if (adminToken) {
    // Get connections
    totalTests++;
    const getConnectionsTest = await testEndpoint('GET', '/connections', null, adminToken);
    if (getConnectionsTest.success) passedTests++;
  }
  
  // Test Results Summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 TEST RESULTS SUMMARY', 'bold');
  log('='.repeat(60), 'blue');
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`✅ Passed: ${passedTests}/${totalTests} tests (${successRate}%)`, 
      successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  if (successRate >= 80) {
    log(`\n🎉 Backend is in excellent condition!`, 'green');
    log(`✅ Ready to proceed with frontend development`, 'green');
  } else if (successRate >= 60) {
    log(`\n⚠️  Backend has some issues but is mostly functional`, 'yellow');
    log(`🔧 Some features may need attention`, 'yellow');
  } else {
    log(`\n❌ Backend has significant issues`, 'red');
    log(`🔧 Major fixes required before frontend development`, 'red');
  }
  
  log('\n🔗 Backend Status: http://localhost:5000/api/health', 'blue');
  log('📱 Ready for frontend testing on: http://localhost:8082', 'blue');
}

// Start the tests
runComprehensiveTests().catch(console.error);