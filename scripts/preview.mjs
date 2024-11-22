import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
const env = dotenv.parse(readFileSync('.env'));

// Debug: Print environment variables (remove sensitive data in production)
console.log('Loaded environment variables:', {
  PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL ? 'exists' : 'missing',
  PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY ? 'exists' : 'missing'
});

// Start the preview server with environment variables
const preview = spawn('astro', ['preview'], {
  stdio: 'inherit',
  env: { ...process.env, ...env },
});

preview.on('error', (err) => {
  console.error('Failed to start preview:', err);
  process.exit(1);
});
