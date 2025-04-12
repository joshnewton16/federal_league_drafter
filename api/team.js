// Serverless function for the /api/teams endpoint
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
    const { yearId, currentYear } = req.query;
    let query;
    
    if (currentYear === 'true') {
      // Get teams for the current year (where current_yr is true)
      query = `
        SELECT t.* 
        FROM ${schemaPrefix}.fl_teams t
        JOIN ${schemaPrefix}.fl_year y ON t.year_id = y.year_id
        WHERE y.current_yr = true
        ORDER BY t.team_id
      `;
    } else if (yearId) {
      // Get teams for a specific year
      query = `
        SELECT * 
        FROM ${schemaPrefix}.fl_teams 
        WHERE year_id = $1
        ORDER BY team_id
      `;
    } else {
      // Get all teams
      query = `
        SELECT * 
        FROM ${schemaPrefix}.fl_teams
        ORDER BY team_id
      `;
    }
    
    const result = yearId 
      ? await pool.query(query, [yearId])
      : await pool.query(query);
      
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ error: 'Failed to fetch teams' });
  }
};