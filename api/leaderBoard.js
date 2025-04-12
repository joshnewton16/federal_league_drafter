// Endpoint for the leaderboard
const { pool, schemaPrefix } = require('./config/db');
const cors = require('./config/cors');

module.exports = async (req, res) => {
  cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const result = await pool.query(`SELECT * FROM ${schemaPrefix}.v_leader_board`);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'LeaderBoard not found' });
    }
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(`Error fetching LeaderBoard:`, error);
    return res.status(500).json({ error: 'Failed to fetch LeaderBoard' });
  }
};