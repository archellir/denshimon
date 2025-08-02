#!/usr/bin/env bun

/**
 * Generate a secure 32-byte key for PASETO v4.local tokens
 * Run with: bun run scripts/generate-key.ts
 */

function generateSecureKey(): string {
  // Generate a cryptographically secure 32-byte key
  const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return key;
}

function main() {
  const key = generateSecureKey();
  
  console.log('🔐 Generated secure PASETO secret key:');
  console.log(key);
  console.log('');
  console.log('📝 Add this to your environment:');
  console.log(`PASETO_SECRET_KEY=${key}`);
  console.log('');
  console.log('⚠️  Keep this key secure and never commit it to version control!');
  console.log('💡 This key is exactly 32 bytes (64 hex characters) as required by PASETO v4.local');
}

main();