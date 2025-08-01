#!/usr/bin/env node

/**
 * Cohere API Connection Test
 * Simple test script to validate API key and connection
 */

const COHERE_API_KEY = process.env.COHERE_API_KEY;

console.log('🧪 Cohere API Connection Test');
console.log('===============================');

// Environment check
console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🗂️ Working Directory: ${process.cwd()}`);
console.log(`📦 Node.js Version: ${process.version}`);

// API Key validation
console.log('\n🔑 API Key Validation:');
if (!COHERE_API_KEY) {
  console.log('❌ COHERE_API_KEY not found in environment');
  console.log('💡 This is expected in local development');
  console.log('✅ GitHub Actions should have this secret configured');
} else if (COHERE_API_KEY === 'undefined' || COHERE_API_KEY.trim() === '') {
  console.log('⚠️ COHERE_API_KEY is set but empty or undefined');
  console.log(`🔍 Value: "${COHERE_API_KEY}" (length: ${COHERE_API_KEY.length})`);
} else {
  console.log(`✅ COHERE_API_KEY found (length: ${COHERE_API_KEY.length})`);
  console.log(`🔍 First 10 chars: ${COHERE_API_KEY.substring(0, 10)}...`);
  
  // Test API connection
  await testCohereConnection();
}

async function testCohereConnection() {
  try {
    console.log('\n🌐 Testing Cohere API Connection...');
    
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Singapore-Weather-Cam-Test/1.0'
      },
      body: JSON.stringify({
        model: 'command',
        prompt: 'Test connection: What is 2+2?',
        max_tokens: 50,
        temperature: 0.1
      })
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cohere API connection successful!');
      console.log(`📝 Response: ${data.generations[0]?.text?.trim() || 'No response text'}`);
    } else {
      const errorText = await response.text();
      console.log('❌ Cohere API connection failed');
      console.log(`🔍 Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log('❌ Cohere API test failed');
    console.log(`🔍 Error: ${error.message}`);
  }
}

console.log('\n🏁 Test completed');