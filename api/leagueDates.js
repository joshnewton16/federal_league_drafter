// Endpoint for league dates
const { pool, schemaPrefix } = require('./config/db');
const cors = require('./config/cors');

module.exports = async (req, res) => {
  cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const result = await pool.query(`SELECT x.* FROM federal_league.fl_league_dates x join federal_league.fl_year y using (year_id) where y.current_yr order by sort_order;`);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'leagueDates not found' });
    }
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(`Error fetching leagueDates:`, error);
    return res.status(500).json({ error: 'Failed to fetch leagueDates' });
  }
};