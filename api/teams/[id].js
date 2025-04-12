// api/teams/[id].js
const { pool, schemaPrefix } = require('../config/db');
const cors = require('../config/cors');

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
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Invalid team ID' });
  }
  
  try {
    console.log(`TeamById API called for team ID: ${id}`);
    
    const result = await pool.query(
      `SELECT * FROM ${schemaPrefix}.fl_teams WHERE team_id = $1`, 
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log(`No team found with ID: ${id}`);
      return res.status(404).json({ error: 'Team not found' });
    }
    
    console.log(`Found team: ${result.rows[0].team_name}`);
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching team ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch team' });
  }
};