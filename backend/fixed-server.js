// Load environment variables first
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const axios = require('axios');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Apply middleware
app.use(cors());
app.use(bodyParser.json());

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://federal_league_admin:jLriXmc4MNd8@ep-flat-paper-a5bp6umk.us-east-2.aws.neon.tech/federal_league?sslmode=require',
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully:', res.rows[0].now);
  }
});

// Setup schema prefix
const schemaPrefix = process.env.DB_SCHEMA || 'federal_league';

// API ROUTES

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root route for testing
app.get('/', (req, res) => {
  res.send('Fantasy Baseball Draft API Server');
});

// Get teams
app.get('/api/teams', async (req, res) => {
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
      
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get current year
app.get('/api/currentYear', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT year_id, year_name 
      FROM ${schemaPrefix}.fl_year 
      WHERE current_yr = true
    `);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No current year found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current year:', error);
    res.status(500).json({ error: 'Failed to fetch current year' });
  }
});

// Get draft picks
app.get('/api/draftResults', async (req, res) => {
  try {
    const { yearId } = req.query;
    let query = `SELECT * FROM ${schemaPrefix}.v_show_draft_results`;
    
    //if (yearId) {
    //  query += ` WHERE year_id = ${yearId}`;
    //} else {
    //  // If no year specified, get current year
     // query += ` WHERE year_id IN (SELECT year_id FROM ${schemaPrefix}.fl_year WHERE current_yr = true)`;
    //}
    
    console.log(query)
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching draft results:', error);
    res.status(500).json({ error: 'Failed to fetch draft results' });
  }
});

// Draft player endpoint
app.post('/api/draftPlayer', async (req, res) => {
  try {
    const { player_api_lookup, team_name, roster_position } = req.body;
    
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
      
      res.status(201).json({ 
        success: true, 
        message: result.rows[0].result 
      });
    } catch (dbError) {
      console.error('Database error when drafting player:', dbError);
      // Return the detailed database error for debugging
      res.status(500).json({ 
        error: 'Database error when drafting player', 
        details: dbError.message,
        hint: dbError.hint,
        code: dbError.code
      });
    }
  } catch (error) {
    console.error('Error drafting player:', error);
    res.status(500).json({ 
      error: 'Failed to draft player', 
      details: error.message 
    });
  }
});

// Get team by ID
app.get('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM ${schemaPrefix}.fl_teams WHERE team_id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching team ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Get team draft picks
app.get('/api/teams/:teamId/draftResults', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { yearId } = req.query;
    
    let query = `SELECT dr.*, 
                       p.player_first_name, p.player_last_name,
                       CASE 
                         WHEN p.bln_p THEN 'P'
                         WHEN p.bln_c THEN 'C'
                         WHEN p.bln_1b THEN '1B'
                         WHEN p.bln_2b THEN '2B'
                         WHEN p.bln_ss THEN 'SS'
                         WHEN p.bln_3b THEN '3B'
                         WHEN p.bln_of THEN 'OF'
                         WHEN p.bln_u THEN 'UTIL'
                         ELSE 'Unknown'
                       END as position
                FROM ${schemaPrefix}.fl_draft_results dr
                JOIN ${schemaPrefix}.fl_players p ON dr.player_id = p.player_id
                WHERE dr.team_id = $1`;
    
    const params = [teamId];
    
    if (yearId) {
      query += ' AND dr.year_id = $2';
      params.push(yearId);
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching draft results for team ${req.params.teamId}:`, error);
    res.status(500).json({ error: 'Failed to fetch team draft results' });
  }
});

// Search players in local database
app.get('/api/players/search', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.json([]);
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
    
    res.json(players);
  } catch (error) {
    console.error(`Error searching players with term "${req.query.term}":`, error);
    res.status(500).json({ error: 'Failed to search players' });
  }
});

// Simplified MLB API player search endpoint (replaced with improved version)
app.get('/api/mlb/search', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.json({ players: [] });
    }
    
    const searchTerm = term.trim().toLowerCase();
    console.log(`MLB API direct search for: "${searchTerm}"`);
    
    // Direct search with minimal parameters
    const url = `https://statsapi.mlb.com/api/v1/people/search`;
    console.log(`Making request to: ${url}?q=${encodeURIComponent(searchTerm)}`);
    
    const response = await axios({
      method: 'get',
      url: url,
      params: { q: searchTerm },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    let players = [];
    
    // Handle both response formats and apply strict filtering
    if (response.data && response.data.search && Array.isArray(response.data.search)) {
      // Filter the results to ensure they actually contain the search term
      const filteredResults = response.data.search.filter(item => {
        if (!item.person) return false;
        
        const fullName = (item.person.fullName || '').toLowerCase();
        const firstName = (item.person.firstName || '').toLowerCase();
        const lastName = (item.person.lastName || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
               firstName.includes(searchTerm) || 
               lastName.includes(searchTerm);
      });
      
      console.log(`Found ${filteredResults.length} relevant players in MLB API search`);
      
      // Format the results
      players = filteredResults.map(item => ({
        id: item.person.id,
        fullName: item.person.fullName || `${item.person.firstName || ''} ${item.person.lastName || ''}`.trim(),
        firstName: item.person.firstName || '',
        lastName: item.person.lastName || '',
        position: item.person.primaryPosition?.abbreviation || '',
        mlbTeam: item.person.currentTeam?.name || '',
        source: 'MLB API'
      }));
    } else if (response.data && response.data.people && Array.isArray(response.data.people)) {
      // Alternative response format
      const filteredResults = response.data.people.filter(player => {
        const fullName = (player.fullName || '').toLowerCase();
        const firstName = (player.firstName || '').toLowerCase();
        const lastName = (player.lastName || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
               firstName.includes(searchTerm) || 
               lastName.includes(searchTerm);
      });
      
      console.log(`Found ${filteredResults.length} relevant players in MLB API search`);
      
      // Format the results
      players = filteredResults.map(player => ({
        id: player.id,
        fullName: player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim(),
        firstName: player.firstName || '',
        lastName: player.lastName || '',
        position: player.primaryPosition?.abbreviation || '',
        mlbTeam: player.currentTeam?.name || '',
        source: 'MLB API'
      }));
    } else {
      console.log('No MLB API search results found or unexpected format');
    }
    
    return res.json({ players });
  } catch (error) {
    console.error('MLB API search error:', error.message);
    res.status(500).json({ 
      error: error.message,
      players: [] 
    });
  }
});

// Combined player search endpoint (improved version)
// Replace the problematic MLB API search endpoints with this improved version
// that uses the player lookup endpoint instead of the search endpoint

// Combined player search endpoint (improved version)
// Updated player search endpoint - searches internal database FIRST, then MLB API
app.get('/api/player-search', async (req, res) => {
  const { term } = req.query;
  const results = { players: [] };
  
  if (!term || term.trim() === '') {
    return res.json(results);
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
  
  res.json(results);
});

// Get specific player by MLB ID - NEW ENDPOINT
app.get('/api/mlb/player/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing player ID parameter' });
    }
    
    console.log(`Fetching MLB player with ID: ${id}`);
    
    // Request specific player data by ID
    const url = `https://statsapi.mlb.com/api/v1/people/${id}`;
    console.log(`Making request to: ${url}`);
    
    const response = await axios({
      method: 'get',
      url: url,
      params: { 
        hydrate: 'currentTeam,stats(group=[hitting,pitching],type=[season,yearByYear])' 
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    // Check if we got player data
    if (response.data && response.data.people && response.data.people.length > 0) {
      const player = response.data.people[0];
      console.log(`Found player: ${player.fullName}`);
      
      // Format the result with the specific data your frontend needs
      const formattedPlayer = {
        id: player.id,
        fullName: player.fullName,
        firstName: player.firstName,
        lastName: player.lastName,
        position: player.primaryPosition?.abbreviation || '',
        mlbTeam: player.currentTeam?.name || '',
        jerseyNumber: player.primaryNumber || '',
        batSide: player.batSide?.code || '',
        pitchHand: player.pitchHand?.code || '',
        stats: player.stats || [],
        // Add any other fields you need
      };
      
      return res.json(formattedPlayer);
    } else {
      console.log(`No player found with ID: ${id}`);
      return res.status(404).json({ error: 'Player not found' });
    }
  } catch (error) {
    console.error(`MLB API player fetch error for ID ${req.params.id}:`, error.message);
    res.status(500).json({ 
      error: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// In your API routes file or Express server
app.get('/api/players/eligibility', async (req, res) => {
  const lookup = req.query.lookup;
  
  if (!lookup) {
    return res.status(400).json({ message: 'Player lookup parameter is required' });
  }
  
  try {
    // Try to find the player in fl_players using various possible fields
    const query = `
      SELECT 
        player_id,
        player_first_name,
        player_last_name,
        player_api_lookup,
        bln_p,
        bln_c,
        bln_1b,
        bln_2b,
        bln_ss,
        bln_3b,
        bln_of,
        bln_u
      FROM 
        fl_players
      WHERE 
        player_api_lookup = $1 OR
        player_id::text = $1 OR
        CONCAT(player_first_name, ' ', player_last_name) ILIKE $1
      LIMIT 1
    `;
    
    const result = await pool.query(query, [lookup]);
    
    if (result.rows.length === 0) {
      // Try a fuzzy match if exact match failed
      const fuzzyQuery = `
        SELECT 
          player_id,
          player_first_name,
          player_last_name,
          player_api_lookup,
          bln_p,
          bln_c,
          bln_1b,
          bln_2b,
          bln_ss,
          bln_3b,
          bln_of,
          bln_u
        FROM 
          fl_players
        WHERE 
          CONCAT(player_first_name, ' ', player_last_name) ILIKE $1
        LIMIT 1
      `;
      
      const fuzzyResult = await pool.query(fuzzyQuery, [`%${lookup}%`]);
      
      if (fuzzyResult.rows.length === 0) {
        // No match found
        return res.status(404).json({ 
          message: 'Player not found in database',
          lookup: lookup,
          eligible_positions: [] 
        });
      }
      
      // Found with fuzzy match
      const player = fuzzyResult.rows[0];
      return res.status(200).json({
        player_id: player.player_id,
        player_name: `${player.player_first_name} ${player.player_last_name}`,
        player_api_lookup: player.player_api_lookup,
        eligible_positions: convertBooleanFlagsToPositions(player)
      });
    }
    
    // Found with exact match
    const player = result.rows[0];
    return res.status(200).json({
      player_id: player.player_id,
      player_name: `${player.player_first_name} ${player.player_last_name}`,
      player_api_lookup: player.player_api_lookup,
      eligible_positions: convertBooleanFlagsToPositions(player)
    });
    
  } catch (error) {
    console.error('Error fetching player eligibility:', error);
    return res.status(500).json({ 
      message: 'Server error fetching player eligibility',
      error: error.message
    });
  }
});

// Helper function to convert boolean flags to position array
function convertBooleanFlagsToPositions(player) {
  const positions = [];
  
  if (player.bln_p) positions.push('P');
  if (player.bln_c) positions.push('C');
  if (player.bln_1b) positions.push('1B');
  if (player.bln_2b) positions.push('2B');
  if (player.bln_ss) positions.push('SS');
  if (player.bln_3b) positions.push('3B');
  if (player. _of) positions.push('OF');

  console.log('positions:', positions);
  
  // We don't include utility (bln_u) in the positions array
  // since it's not an actual position but a roster slot type
  
  return positions;
}

app.get('/api/team-roster/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const query = `
      SELECT r.*, s.roster_slot_name 
      FROM ${schemaPrefix}.fl_rosters r
      JOIN ${schemaPrefix}.def_roster_slot s ON r.roster_slot_id = s.roster_slot_id
      WHERE r.team_id = $1
    `;
    
    const result = await pool.query(query, [teamId]);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching roster for team ${req.params.teamId}:`, error);
    res.status(500).json({ error: 'Failed to fetch team roster' });
  }
});

// Get all MLB teams
app.get('/api/mlb/teams', async (req, res) => {
  try {
    const response = await axios.get('https://statsapi.mlb.com/api/v1/teams', {
      params: {
        sportId: 1, // 1 = MLB
        season: new Date().getFullYear()
      },
      headers: {
        'User-Agent': 'Fantasy Baseball Draft App'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching MLB teams:', error.message);
    res.status(500).json({ error: 'Failed to fetch MLB teams' });
  }
});

// Get players from minor league affiliates of an MLB team
app.get('/api/mlb/affiliates/:teamId/players', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // First get the team's affiliates
    const affiliatesResponse = await axios.get(`https://statsapi.mlb.com/api/v1/teams/${teamId}/affiliates`, {
      headers: {
        'User-Agent': 'Fantasy Baseball Draft App'
      }
    });
    
    const affiliateTeams = affiliatesResponse.data.teams || [];
    const affiliateIds = affiliateTeams.map(team => team.id);
    
    // Get players from each affiliate team
    const playerPromises = affiliateIds.map(async (affiliateId) => {
      const rosterResponse = await axios.get(`https://statsapi.mlb.com/api/v1/teams/${affiliateId}/roster`, {
        params: {
          rosterType: 'fullRoster'
        },
        headers: {
          'User-Agent': 'Fantasy Baseball Draft App'
        }
      });
      
      // Return roster with team info
      const teamInfo = affiliateTeams.find(team => team.id === affiliateId);
      return {
        teamId: affiliateId,
        teamName: teamInfo ? teamInfo.name : 'Unknown Affiliate',
        teamLevel: teamInfo ? teamInfo.parentOrgLevel : 'Unknown',
        roster: rosterResponse.data.roster || []
      };
    });
    
    const allRosters = await Promise.all(playerPromises);
    
    // Combine and format all players
    const allPlayers = [];
    allRosters.forEach(team => {
      team.roster.forEach(player => {
        allPlayers.push({
          id: player.person.id,
          fullName: player.person.fullName,
          position: player.position.abbreviation,
          mlbTeam: team.teamName,
          level: team.teamLevel,
          jerseyNumber: player.jerseyNumber,
          status: player.status ? player.status.description : '',
          player_api_lookup: `{"${player.person.fullName}"}`,
          source: 'MLB MiLB API'
        });
      });
    });
    
    res.json({ 
      players: allPlayers,
      affiliates: affiliateTeams.map(team => ({
        id: team.id,
        name: team.name,
        level: team.parentOrgLevel
      }))
    });
  } catch (error) {
    console.error('Error fetching minor league players:', error.message);
    res.status(500).json({ error: 'Failed to fetch minor league players' });
  }
});

// Get LeaderBoard
app.get('/api/leaderBoard', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${schemaPrefix}.v_leader_board`);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'LeaderBoard not found' });
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching LeaderBoard:`, error);
    res.status(500).json({ error: 'Failed to fetch LeaderBoard' });
  }
});

// Get LeagueDates
app.get('/api/leagueDates', async (req, res) => {
  try {
    const result = await pool.query(`SELECT x.* FROM federal_league.fl_league_dates x join federal_league.fl_year y using (year_id) where y.current_yr order by sort_order;`);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'leagueDates not found' });
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error(`Error fetching leagueDates:`, error);
    res.status(500).json({ error: 'Failed to fetch leagueDates' });
  }
});

app.use('/api/team-stats/:id', require('../api/team-stats/[id]'));