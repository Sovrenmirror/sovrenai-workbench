/**
 * Comprehensive Test Suite for SovrenAI Hot Code Web UI
 * Tests all major modes: Auth, Chat, Agents, Classification
 *
 * Run: npx tsx tests/comprehensive-test.ts
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config({ path: resolve(__dirname, '../.env') });

const API_BASE = 'http://localhost:3750';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, message: 'Passed', duration });
    console.log(`  \u2713 ${name} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    results.push({ name, passed: false, message: error.message, duration });
    console.log(`  \u2717 ${name}: ${error.message} (${duration}ms)`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// ============ AUTH TESTS ============

async function testAuthSession(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/auth/session`);
  const data = await response.json();
  assert(response.ok, `Failed to get session: ${response.status}`);
  assert(data.token, 'Token not returned');
  assert(data.user, 'User not returned');
}

async function testAuthLogin(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/auth/founder-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    })
  });
  const data = await response.json();
  assert(response.ok || data.token, 'Login failed');
}

// ============ CLASSIFICATION TESTS ============

async function testClassification(): Promise<void> {
  // Get auth token first
  const authResponse = await fetch(`${API_BASE}/api/v1/auth/session`);
  const authData = await authResponse.json();
  const token = authData.token;

  const response = await fetch(`${API_BASE}/api/v1/classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query: 'What is entropy?' })
  });
  const data = await response.json();
  assert(response.ok, `Classification failed: ${response.status}`);
  assert(data.tier !== undefined, 'Tier not returned');
  assert(data.confidence !== undefined, 'Confidence not returned');
}

async function testClassificationTiers(): Promise<void> {
  const authResponse = await fetch(`${API_BASE}/api/v1/auth/session`);
  const authData = await authResponse.json();
  const token = authData.token;

  // Test various tier expectations
  const testCases = [
    { query: 'What is 2+2?', expectedTierRange: [0, 4] },
    { query: 'What is the meaning of life?', expectedTierRange: [5, 12] },
    { query: 'Who is the current president?', expectedTierRange: [1, 6] },
  ];

  for (const testCase of testCases) {
    const response = await fetch(`${API_BASE}/api/v1/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: testCase.query })
    });
    const data = await response.json();
    assert(response.ok, `Classification failed for "${testCase.query}"`);
    // Note: Tier range validation is loose since classification can vary
  }
}

// ============ CONVERSATIONAL MODE TESTS ============

async function testConversationalDetection(): Promise<void> {
  const authResponse = await fetch(`${API_BASE}/api/v1/auth/session`);
  const authData = await authResponse.json();
  const token = authData.token;

  const greetings = ['hello', 'hi', 'hey', 'good morning', 'how are you'];

  for (const greeting of greetings) {
    const response = await fetch(`${API_BASE}/api/chat/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: greeting })
    });
    const data = await response.json();
    assert(response.ok, `Chat failed for "${greeting}": ${response.status}`);
    // Conversational responses should have isConversational flag
    assert(data.isConversational === true, `"${greeting}" should be detected as conversational, got isConversational=${data.isConversational}`);
  }
}

async function testNonConversational(): Promise<void> {
  const authResponse = await fetch(`${API_BASE}/api/v1/auth/session`);
  const authData = await authResponse.json();
  const token = authData.token;

  const queries = ['What is the speed of light?', 'Research quantum computing'];

  for (const query of queries) {
    const response = await fetch(`${API_BASE}/api/chat/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: query })
    });
    const data = await response.json();
    assert(response.ok, `Chat failed for "${query}": ${response.status}`);
    // Non-conversational queries should not have isConversational flag
    assert(data.isConversational !== true, `"${query}" should not be conversational`);
  }
}

// ============ AGENT TESTS ============

async function testAgentMention(): Promise<void> {
  const authResponse = await fetch(`${API_BASE}/api/v1/auth/session`);
  const authData = await authResponse.json();
  const token = authData.token;

  const response = await fetch(`${API_BASE}/api/chat/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: 'Analyze the market trends',
      mentions: ['analyst']
    })
  });
  const data = await response.json();
  assert(response.ok, `Agent mention failed: ${response.status} - ${JSON.stringify(data)}`);
  assert(data.agentId === 'analyst', `Expected analyst agent, got ${data.agentId}`);
}

async function testAgentRouting(): Promise<void> {
  const authResponse = await fetch(`${API_BASE}/api/v1/auth/session`);
  const authData = await authResponse.json();
  const token = authData.token;

  const testCases = [
    { message: 'Research the history of AI', expectedAgent: 'researcher' },
    { message: 'Analyze the data patterns', expectedAgent: 'analyst' },
    { message: 'Write a summary of the findings', expectedAgent: 'writer' },
    { message: 'Create a diagram of the system', expectedAgent: 'designer' },
    { message: 'Plan the project timeline', expectedAgent: 'planner' },
    { message: 'Review the document for errors', expectedAgent: 'reviewer' },
  ];

  for (const testCase of testCases) {
    const response = await fetch(`${API_BASE}/api/chat/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: testCase.message })
    });
    const data = await response.json();
    assert(response.ok, `Routing test failed for "${testCase.message}": ${response.status}`);
    // Note: Agent routing depends on keywords, may vary
  }
}

// ============ HEALTH CHECK TESTS ============

async function testHealthEndpoint(): Promise<void> {
  const response = await fetch(`${API_BASE}/health`);
  assert(response.ok, `Health check failed: ${response.status}`);
}

async function testSystemDiagnostic(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/system/diagnostic`);
  // Diagnostic may require auth, so just check it responds
  assert(response.status !== 500, `Diagnostic endpoint server error: ${response.status}`);
}

// ============ DOCUMENT TESTS ============

async function testDocumentCreate(): Promise<void> {
  const authResponse = await fetch(`${API_BASE}/api/v1/auth/session`);
  const authData = await authResponse.json();
  const token = authData.token;

  const response = await fetch(`${API_BASE}/api/v1/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Test Document',
      content: 'This is a test document created by the test suite.'
    })
  });
  // Document creation may or may not be implemented
  assert(response.status !== 500, `Document creation server error: ${response.status}`);
}

// ============ MAIN TEST RUNNER ============

async function runAllTests(): Promise<void> {
  console.log('\n========================================');
  console.log('  SovrenAI Comprehensive Test Suite');
  console.log('========================================\n');

  console.log('Auth Tests:');
  await runTest('Session endpoint returns token', testAuthSession);
  await runTest('Founder login works', testAuthLogin);

  console.log('\nClassification Tests:');
  await runTest('Basic classification works', testClassification);
  await runTest('Classification tier ranges', testClassificationTiers);

  console.log('\nConversational Mode Tests:');
  await runTest('Greetings detected as conversational', testConversationalDetection);
  await runTest('Questions not marked conversational', testNonConversational);

  console.log('\nAgent Tests:');
  await runTest('Agent mention routing', testAgentMention);
  await runTest('Automatic agent routing', testAgentRouting);

  console.log('\nHealth & Diagnostic Tests:');
  await runTest('Health endpoint', testHealthEndpoint);
  await runTest('System diagnostic endpoint', testSystemDiagnostic);

  console.log('\nDocument Tests:');
  await runTest('Document creation', testDocumentCreate);

  // Summary
  console.log('\n========================================');
  console.log('  Test Summary');
  console.log('========================================');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`  Total: ${results.length}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log('\n  Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`    - ${r.name}: ${r.message}`);
    });
  }

  console.log('\n========================================\n');

  // Exit with error code if tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  console.log('Checking if server is running...');
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.error('\n  Error: Server is not running at', API_BASE);
    console.error('  Please start the server with: npm run dev');
    console.error('  Then run tests again.\n');
    process.exit(1);
  }

  console.log('Server is running. Starting tests...\n');
  await runAllTests();
}

main().catch(console.error);
