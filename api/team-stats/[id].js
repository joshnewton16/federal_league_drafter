// api/teams/[id]/stats.js
const { pool, schemaPrefix } = require('../../config/db');
const cors = require('../../config/cors');

console.log('Stats API module loaded at:', new Date().toISOString());

module.exports = async (req, res) => {
  // Set CORS headers
  cors(req, res);
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Extract the team ID from the URL
  // In Vercel serverless, the parameter is usually in req.query.id or similar
  // We need to parse the URL manually
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log('stats url', url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 2]; // Get the ID from the second-to-last path segment

  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Invalid team ID' });
  }
  
  try {
    console.log(`TeamStats API called for team ID: ${id}`);
    
    const result = await pool.query(
      `SELECT v.* FROM federal_league.v_all_team_stats_id AS v where v.team_id = $1`, 
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log(`No stats found for team ID: ${id}`);
      return res.status(404).json({ error: 'Team stats not found' });
    }
    
    console.log(`Found stats for team ID: ${id}`);
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching stats for team ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch team stats' });
  }
};