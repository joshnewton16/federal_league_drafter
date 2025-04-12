// Endpoint for draft results
const { pool, schemaPrefix } = require('./config/db');
const cors = require('./config/cors');

module.exports = async (req, res) => {
  cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { yearId } = req.query;
    let query = `SELECT * FROM ${schemaPrefix}.v_show_draft_results`;
    
    console.log(query);
    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching draft results:', error);
    return res.status(500).json({ error: 'Failed to fetch draft results' });
  }
};