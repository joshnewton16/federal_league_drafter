// api/player-search.js
const { pool, schemaPrefix } = require('./config/db');
const axios = require('axios');
const cors = require('./config/cors');

module.exports = async (req, res) => {
  // Set CORS headers
  cors(req, res);
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { term } = req.query;
  const results = { players: [] };
  
  if (!term || term.trim() === '') {
    return res.status(200).json(results);
  }
  
  const searchTerm = term.trim().toLowerCase();
  console.log(`Combined search for term: "${searchTerm}"`);
  
  // Step 1: FIRST search the internal database
  try {
    console.log(`Searching internal database for: "${searchTerm}"`);
    
    const dbResult = await pool.query(
      `SELECT * FROM ${schemaPrefix}.fl_players 
       WHERE player_first_name ILIKE $1 
       OR player_last_name ILIKE $1
       OR player_api_lookup ILIKE $1
       OR CONCAT(player_first_name, ' ', player_last_name) ILIKE $1
       LIMIT 20`,
      [`%${searchTerm}%`]
    );
    
    if (dbResult.rows.length > 0) {
      console.log(`Found ${dbResult.rows.length} players in local database`);
      
      // Format the database results
      const dbPlayers = dbResult.rows.map(player => {
        // Still calculate the primary position string as before
        let position = '';
        if (player.bln_p) position = 'P';
        else if (player.bln_c) position = 'C';
        else if (player.bln_1b) position = '1B';
        else if (player.bln_2b) position = '2B';
        else if (player.bln_ss) position = 'SS';
        else if (player.bln_3b) position = '3B';
        else if (player.bln_of) position = 'OF';
        else if (player.bln_u) position = 'UTIL';
        
        // Calculate eligible positions array
        const eligiblePositions = [];
        if (player.bln_p) eligiblePositions.push('P');
        if (player.bln_c) eligiblePositions.push('C');
        if (player.bln_1b) eligiblePositions.push('1B');
        if (player.bln_2b) eligiblePositions.push('2B');
        if (player.bln_ss) eligiblePositions.push('SS');
        if (player.bln_3b) eligiblePositions.push('3B');
        if (player.bln_of) eligiblePositions.push('OF');
        
        return {
          id: player.player_id,
          fullName: `${player.player_first_name} ${player.player_last_name}`.trim(),
          firstName: player.player_first_name || '',
          lastName: player.player_last_name || '',
          position: position,
          player_api_lookup: player.player_api_lookup,
          // Include these boolean flags
          bln_p: player.bln_p || false,
          bln_c: player.bln_c || false,
          bln_1b: player.bln_1b || false,
          bln_2b: player.bln_2b || false,
          bln_ss: player.bln_ss || false,
          bln_3b: player.bln_3b || false,
          bln_of: player.bln_of || false,
          bln_u: player.bln_u || false,
          // Include the eligiblePositions array for convenience
          eligiblePositions: eligiblePositions,
          source: 'Database'
        };
      });
      
      results.players.push(...dbPlayers);
    } else {
      console.log(`No players found in database matching "${searchTerm}"`);
    }
  } catch (dbError) {
    console.error('Database search error:', dbError.message);
  }
  
  // Step 2: THEN use MLB API player lookup as a backup
  // Only proceed with MLB API if we don't have enough results from the database
  if (results.players.length < 5) {
    try {
      console.log(`Database returned ${results.players.length} results, checking MLB API...`);
      
      // The MLB Stats API doesn't have a great search endpoint, so we'll use
      // the player lookup and filter on our end
      const url = `https://statsapi.mlb.com/api/v1/sports/1/players`;
      
      console.log(`Making MLB API request to: ${url}`);
      
      const mlbResponse = await axios({
        method: 'get',
        url: url,
        params: {
          season: new Date().getFullYear(), // Current season
          gameType: 'R', // Regular season
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        },
        timeout: 8000 // 8 second timeout
      });
      
      if (mlbResponse.data && mlbResponse.data.people && Array.isArray(mlbResponse.data.people)) {
        console.log(`MLB API returned ${mlbResponse.data.people.length} total players`);
        
        // Apply strict filtering to find players matching the search term
        const filteredResults = mlbResponse.data.people.filter(player => {
          const fullName = (player.fullName || '').toLowerCase();
          const firstName = (player.firstName || '').toLowerCase();
          const lastName = (player.lastName || '').toLowerCase();
          
          // Check if any name part actually contains the search term
          return fullName.includes(searchTerm) || 
                 firstName.includes(searchTerm) || 
                 lastName.includes(searchTerm);
        });
        
        console.log(`After filtering: ${filteredResults.length} relevant players found in MLB API`);
        
        if (filteredResults.length > 0) {
          // Format the MLB API results
          const mlbPlayers = filteredResults.map(player => ({
            id: player.id,
            fullName: player.fullName || '',
            firstName: player.firstName || '',
            lastName: player.lastName || '',
            position: player.primaryPosition?.abbreviation || '',
            mlbTeam: player.currentTeam?.name || '',
            player_api_lookup: player.fullName || '',
            source: 'MLB API'
          }));
          
          results.players.push(...mlbPlayers);
        }
      } else {
        console.log('MLB API returned unexpected format');
      }
    } catch (mlbError) {
      console.error('MLB API player lookup error:', mlbError.message);
    }
  } else {
    console.log(`Sufficient results (${results.players.length}) found in database, skipping MLB API`);
  }
  
  // Step 3: Return the combined results
  console.log(`Combined search found ${results.players.length} total players`);
  
  // Log first few results for debugging
  if (results.players.length > 0) {
    console.log('First few results:');
    results.players.slice(0, 3).forEach((player, index) => {
      console.log(`  ${index+1}. ${player.fullName} (${player.source})`);
    });
  }
  
  return res.status(200).json(results);
};