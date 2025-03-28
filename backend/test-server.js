// Load environment variables
require('dotenv').config();

// Import required packages
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

// Create the express app
const app = express();

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

// Set schema prefix
const schemaPrefix = process.env.DB_SCHEMA || 'federal_league';

// Get teams endpoint
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
    const axios = require('axios');
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

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
// Load environment variables
require('dotenv').config();

// Import express
const express = require('express');

// Create the express app
const app = express();

// Simple route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start server
const port = 3001;
app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});