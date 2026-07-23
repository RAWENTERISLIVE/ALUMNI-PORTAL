const path = require('node:path');
const fs = require('node:fs');

// Mock req and res objects
function createMockResponse() {
  const res = {
    statusCode: 200,
    jsonPayload: null,
    sentFile: null,
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (payload) {
      this.jsonPayload = payload;
      return this;
    },
    sendFile: function (filePath) {
      this.sentFile = filePath;
      return this;
    }
  };
  return res;
}

// Simulated serveFile logic matching our controller fix
function simulateServeFile(filename, res) {
  if (typeof filename !== 'string' || !filename) {
    return res.status(400).json({
      success: false,
      message: 'Filename is required and must be a string'
    });
  }

  // Sanitize the filename to prevent path traversal
  const safeFilename = path.basename(filename.replace(/\\/g, '/'));

  if (!safeFilename || safeFilename === '.' || safeFilename === '..') {
    return res.status(400).json({
      success: false,
      message: 'Invalid filename'
    });
  }

  const filePath = path.resolve(__dirname, 'backend/uploads', safeFilename);

  // Check if file exists and is indeed a file (not a directory) to prevent directory listing or access
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  return res.sendFile(filePath);
}

// Setup a mock uploads directory and some test files
const uploadsDir = path.resolve(__dirname, 'backend/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const testFile = path.join(uploadsDir, 'test-image.png');
fs.writeFileSync(testFile, 'dummy file content');

console.log('Running Path Traversal Protection Tests...');

// Test 1: Legitimate access to a file inside uploads
let res1 = createMockResponse();
simulateServeFile('test-image.png', res1);
if (res1.sentFile && res1.sentFile.endsWith('test-image.png')) {
  console.log('✅ Test 1 Passed: Legitimate file served correctly.');
} else {
  console.error('❌ Test 1 Failed: Legitimate file was not served.', res1);
  process.exit(1);
}

// Test 2: Standard Path Traversal attempt
let res2 = createMockResponse();
simulateServeFile('../../package.json', res2);
if (res2.statusCode === 404 && !res2.sentFile) {
  console.log('✅ Test 2 Passed: Standard path traversal successfully blocked (returned 404).');
} else {
  console.error('❌ Test 2 Failed: Standard path traversal was not blocked!', res2);
  process.exit(1);
}

// Test 3: Windows-style Path Traversal attempt
let res3 = createMockResponse();
simulateServeFile('..\\..\\package.json', res3);
if (res3.statusCode === 404 && !res3.sentFile) {
  console.log('✅ Test 3 Passed: Windows-style path traversal successfully blocked (returned 404).');
} else {
  console.error('❌ Test 3 Failed: Windows-style path traversal was not blocked!', res3);
  process.exit(1);
}

// Test 4: Accessing the uploads directory itself (not a file)
let res4 = createMockResponse();
simulateServeFile('.', res4);
if (res4.statusCode === 400 || res4.statusCode === 404) {
  console.log('✅ Test 4 Passed: Directory access attempt successfully blocked.');
} else {
  console.error('❌ Test 4 Failed: Directory access was not blocked!', res4);
  process.exit(1);
}

// Test 5: Empty/invalid inputs
let res5 = createMockResponse();
simulateServeFile('', res5);
if (res5.statusCode === 400) {
  console.log('✅ Test 5 Passed: Empty filename rejected correctly.');
} else {
  console.error('❌ Test 5 Failed: Empty filename was not rejected!', res5);
  process.exit(1);
}

console.log('\n🎉 All Path Traversal Protection tests passed successfully!\n');

// Cleanup test file
if (fs.existsSync(testFile)) {
  fs.unlinkSync(testFile);
}
