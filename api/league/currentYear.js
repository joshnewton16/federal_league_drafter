// api/currentYear.js
const { pool, schemaPrefix } = require('../config/db');
const cors = require('../config/cors');

module.exports = async (req, res) => {
  // Set CORS headers
  cors(req, res);
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    console.log('CurrentYear API called');
    
    const result = await pool.query(`
      SELECT year_id, year_name 
      FROM ${schemaPrefix}.fl_year 
      WHERE current_yr = true
    `);
    
    if (result.rows.length === 0) {
      console.log('No current year found');
      return res.status(404).json({ error: 'No current year found' });
    }
    
    console.log(`Found current year: ${result.rows[0].year_name}`);
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current year:', error);
    return res.status(500).json({ error: 'Failed to fetch current year' });
  }
};