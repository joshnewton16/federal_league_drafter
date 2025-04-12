// Endpoint for searching players
const { pool, schemaPrefix } = require('./config/db');
const cors = require('./config/cors');

module.exports = async (req, res) => {
  cors(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(200).json([]);
    }
    
    console.log(`Searching for players with term: "${term}"`);
    
    // Use a more flexible search query with ILIKE for partial matching
    const result = await pool.query(
      `SELECT * FROM ${schemaPrefix}.fl_players 
       WHERE player_first_name ILIKE $1 
       OR player_last_name ILIKE $1
       OR player_api_lookup ILIKE $1
       OR CONCAT(player_first_name, ' ', player_last_name) ILIKE $1
       LIMIT 20`,
      [`%${term}%`]
    );
    
    console.log(`Found ${result.rows.length} players matching "${term}"`);
    
    // Map the boolean position flags to a position string for the API
    const players = result.rows.map(player => {
      let position = '';
      if (player.bln_p) position = 'P';
      else if (player.bln_c) position = 'C';
      else if (player.bln_1b) position = '1B';
      else if (player.bln_2b) position = '2B';
      else if (player.bln_ss) position = 'SS';
      else if (player.bln_3b) position = '3B';
      else if (player.bln_of) position = 'OF';
      else if (player.bln_u) position = 'UTIL';
      
      return {
        ...player,
        position,
        name: `${player.player_first_name} ${player.player_last_name}`
      };
    });
    
    return res.status(200).json(players);
  } catch (error) {
    console.error(`Error searching players with term "${req.query.term}":`, error);
    return res.status(500).json({ error: 'Failed to search players' });
  }
};