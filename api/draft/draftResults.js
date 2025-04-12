// api/draftResults.js
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
    const { yearId } = req.query;
    console.log('DraftResults API called with:', { yearId });
    
    let query = `SELECT * FROM ${schemaPrefix}.v_show_draft_results`;
    
    console.log('Executing query:', query);
    const result = await pool.query(query);
    
    console.log(`Found ${result.rows.length} draft results`);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching draft results:', error);
    return res.status(500).json({ error: 'Failed to fetch draft results' });
  }
};