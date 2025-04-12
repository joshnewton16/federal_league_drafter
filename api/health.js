// api/health.js
const cors = require('./config/cors');

module.exports = async (req, res) => {
  // Set CORS headers
  cors(req, res);
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log('Health check endpoint called');
  return res.status(200).json({ status: 'ok', message: 'Server is running' });
};