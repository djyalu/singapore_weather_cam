#!/usr/bin/env node

/**
 * Cohere API Connection Test Script
 * 
 * Tests the Cohere API connection and validates the API key
 * Used by GitHub Actions to verify API connectivity before running analysis
 */

const COHERE_API_KEY = process.env.COHERE_API_KEY;

console.log('🧪 Cohere API Connection Test');
console.log('===============================');
console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🗂️ Working Directory: ${process.cwd()}`);
console.log(`📦 Node.js Version: ${process.version}`);
console.log('');

console.log('🔑 API Key Validation:');
if (!COHERE_API_KEY || COHERE_API_KEY.trim() === '' || COHERE_API_KEY === 'undefined') {
  console.error('❌ COHERE_API_KEY not found or invalid');
  console.error('💡 Please set COHERE_API_KEY in GitHub Secrets');
  process.exit(1);
}

console.log(`✅ COHERE_API_KEY found (length: ${COHERE_API_KEY.length})`);
console.log(`🔍 First 10 chars: ${COHERE_API_KEY.substring(0, 10)}...`);
console.log('');

console.log('🌐 Testing Cohere API Connection...');

async function testCohereAPI() {
  try {
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Singapore-Weather-Cam-Test/1.0'
      },
      body: JSON.stringify({
        model: 'command',
        prompt: 'What is 2+2?',
        max_tokens: 10,
        temperature: 0.1
      })
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Cohere API connection successful!');
    console.log(`📝 Response: ${result.generations[0]?.text?.trim() || 'No response'}`);
    console.log('');
    console.log('🏁 Test completed');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCohereAPI().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});