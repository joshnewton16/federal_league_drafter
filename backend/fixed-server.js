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

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

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

// Root route for testing
app.get('/', (req, res) => {
  res.send('Fantasy Baseball Draft API Server');
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ status: 'ok', message: 'Server is running' });
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Get teams
app.get('/api/teams', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.* 
      FROM ${schemaPrefix}.fl_teams t
      JOIN ${schemaPrefix}.fl_year y ON t.year_id = y.year_id
      WHERE y.current_yr = true
      ORDER BY t.team_id
    `);
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
    let query = `SELECT * FROM ${schemaPrefix}.fl_draft_results`;
    
    if (yearId) {
      query += ` WHERE year_id = ${yearId}`;
    } else {
      // If no year specified, get current year
      query += ` WHERE year_id IN (SELECT year_id FROM ${schemaPrefix}.fl_year WHERE current_yr = true)`;
    }
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching draft results:', error);
    res.status(500).json({ error: 'Failed to fetch draft results' });
  }
});

// Draft player
app.post('/api/draftPlayer', async (req, res) => {
  try {
    const { player_api_lookup, team_name, roster_position } = req.body;
    
    console.log('Drafting player:', { player_api_lookup, team_name, roster_position });
    
    // Call the database function
    const result = await pool.query(
      `SELECT ${schemaPrefix}.draft_player($1, $2, $3) AS result`,
      [player_api_lookup, team_name, roster_position]
    );
    
    console.log('Draft result:', result.rows[0]);
    
    res.status(201).json({ 
      success: true, 
      message: result.rows[0].result 
    });
  } catch (error) {
    console.error('Error drafting player:', error);
    res.status(500).json({ 
      error: 'Failed to draft player', 
      details: error.message 
    });
  }
});

// Search players
app.get('/api/players/search', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.json([]);
    }
    
    const result = await pool.query(
      `SELECT * FROM ${schemaPrefix}.fl_players 
       WHERE player_first_name ILIKE $1 
       OR player_last_name ILIKE $1
       OR player_api_lookup ILIKE $1`,
      [`%${term}%`]
    );
    
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

// MLB API proxy
app.get('/api/mlb/players', async (req, res) => {
  try {
    const { names, season } = req.query;
    
    // Use axios to make the request to MLB API
    const response = await axios.get(`https://statsapi.mlb.com/api/v1/players`, {
      params: {
        names: names,
        season: season || new Date().getFullYear()
      },
      headers: {
        'User-Agent': 'Fantasy Baseball Draft App'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying MLB API request:', error.message);
    
    // Try to fall back to our database
    try {
      const { names } = req.query;
      const result = await pool.query(
        `SELECT * FROM ${schemaPrefix}.fl_players 
         WHERE player_first_name ILIKE $1 
         OR player_last_name ILIKE $1
         OR player_api_lookup ILIKE $1`,
        [`%${names}%`]
      );
      
      // Format as MLB API-like response
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
          id: player.player_id,
          fullName: `${player.player_first_name} ${player.player_last_name}`,
          primaryPosition: { abbreviation: position },
          currentTeam: { name: player.player_api_lookup },
          player_api_lookup: player.player_api_lookup
        };
      });
      
      res.json({ people: players, fallback: true });
    } catch (dbError) {
      console.error('Database fallback failed:', dbError);
      if (error.response) {
        return res.status(error.response.status).json({
          error: `MLB API error: ${error.response.status}`,
          data: error.response.data
        });
      }
      res.status(500).json({ error: 'Failed to fetch from MLB API and database fallback' });
    }
  }
});

// Get single team
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});