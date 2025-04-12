// server-local.js
// This file is used for local development only
// It runs your existing Express server (fixed-server.js)

const { spawn } = require('child_process');
const path = require('path');

// Get the path to the fixed-server.js file
const serverPath = path.join(__dirname, 'backend', 'fixed-server.js');

console.log(`Starting backend server from: ${serverPath}`);

// Spawn a child process to run the server
const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit' // This will pipe the child process's stdout/stderr to the parent
});

// Handle server process events
serverProcess.on('error', (error) => {
  console.error('Failed to start server process:', error);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Stopping server process...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping server process...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});