// api/leaderBoard.js
const { pool, schemaPrefix } = require('./config/db');
const cors = require('./config/cors');

module.exports = async (req, res) => {
  // Set CORS headers
  cors(req, res);
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    console.log('LeaderBoard API called');
    
    const result = await pool.query(`SELECT * FROM ${schemaPrefix}.v_leader_board`);
    
    if (result.rows.length === 0) {
      console.log('No leaderboard data found');
      return res.status(404).json({ error: 'LeaderBoard not found' });
    }
    
    console.log(`Found ${result.rows.length} leaderboard entries`);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(`Error fetching LeaderBoard:`, error);
    return res.status(500).json({ error: 'Failed to fetch LeaderBoard' });
  }
};