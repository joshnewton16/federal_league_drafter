// Endpoint for current year
const { pool, schemaPrefix } = require('./config/db');
const cors = require('./config/cors');

module.exports = async (req, res) => {
  cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const result = await pool.query(`
      SELECT year_id, year_name 
      FROM ${schemaPrefix}.fl_year 
      WHERE current_yr = true
    `);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No current year found' });
    }
    
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current year:', error);
    return res.status(500).json({ error: 'Failed to fetch current year' });
  }
};