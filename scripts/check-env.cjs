#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.production') });

const required = ['VITE_API_BASE_URL', 'VITE_API_KEY'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('\nMissing required build-time environment variables: ' + missing.join(', '));
  console.error('Set them in your environment or in .env.production before running `npm run build`.');
  console.error('Example (.env.production):');
  console.error('VITE_API_BASE_URL=https://your-api.example.com');
  console.error('VITE_API_KEY=your-client-api-key');
  process.exit(1);
}

console.log('All required VITE_* env vars present.');
