// Endpoint for drafting a player
const { pool, schemaPrefix } = require('./config/db');
const cors = require('./config/cors');

module.exports = async (req, res) => {
  cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { player_api_lookup, team_name, roster_position } = JSON.parse(req.body);
    
    console.log('Drafting player:', { player_api_lookup, team_name, roster_position });
    
    // Add more detailed error handling and validation
    if (!player_api_lookup) {
      return res.status(400).json({ error: 'Missing player_api_lookup parameter' });
    }
    
    if (!team_name) {
      return res.status(400).json({ error: 'Missing team_name parameter' });
    }
    
    if (!roster_position) {
      return res.status(400).json({ error: 'Missing roster_position parameter' });
    }
    
    // Call the database function with error tracing
    try {
      const result = await pool.query(
        `SELECT ${schemaPrefix}.draft_player($1, $2, $3) AS result`,
        [player_api_lookup, team_name, roster_position]
      );
      
      console.log('Draft result:', result.rows[0]);
      
      return res.status(201).json({ 
        success: true, 
        message: result.rows[0].result 
      });
    } catch (dbError) {
      console.error('Database error when drafting player:', dbError);
      // Return the detailed database error for debugging
      return res.status(500).json({ 
        error: 'Database error when drafting player', 
        details: dbError.message,
        hint: dbError.hint,
        code: dbError.code
      });
    }
  } catch (error) {
    console.error('Error drafting player:', error);
    return res.status(500).json({ 
      error: 'Failed to draft player', 
      details: error.message 
    });
  }
};