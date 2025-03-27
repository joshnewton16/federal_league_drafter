const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure PostgreSQL connection
const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
  // If you have a schema, uncomment and set this:
  // schema: 'federal_league'
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully:', res.rows[0].now);
  }
});

// Schema prefix - use this consistently for all queries
// Replace with your actual schema if different
const schemaPrefix = 'federal_league.';

// API Routes

// Teams
app.get('/api/teams', async (req, res) => {
  try {
    const { yearId } = req.query;
    const yearFilter = yearId ? `WHERE year_id = ${yearId}` : '';
    
    const result = await pool.query(`SELECT * FROM ${schemaPrefix}fl_teams ${yearFilter}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.get('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM ${schemaPrefix}fl_teams WHERE team_id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching team ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { year_id, team_name, owner_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO ${schemaPrefix}fl_teams (year_id, team_name, owner_id) 
       VALUES ($1, $2, $3) RETURNING team_id`,
      [year_id, team_name, owner_id]
    );
    
    res.status(201).json({ team_id: result.rows[0].team_id });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

app.put('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { team_name, owner_id } = req.body;
    
    await pool.query(
      `UPDATE ${schemaPrefix}fl_teams SET team_name = $1, owner_id = $2 WHERE team_id = $3`,
      [team_name, owner_id, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Error updating team ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Draft Picks
app.get('/api/draftResults', async (req, res) => {
  try {
    const { yearId } = req.query;
    const yearFilter = yearId ? `WHERE year_id = ${yearId}` : '';
    
    const result = await pool.query(`SELECT * FROM ${schemaPrefix}fl_draft_results ${yearFilter}`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching draft results:', error);
    res.status(500).json({ error: 'Failed to fetch draft results' });
  }
});

app.post('/api/draftResults', async (req, res) => {
  try {
    const { year_id, team_id, player_id, roster_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO ${schemaPrefix}fl_draft_results (year_id, team_id, player_id, roster_id) 
       VALUES ($1, $2, $3, $4) RETURNING draft_result_id`,
      [year_id, team_id, player_id, roster_id]
    );
    
    res.status(201).json({ draft_result_id: result.rows[0].draft_result_id });
  } catch (error) {
    console.error('Error creating draft result:', error);
    res.status(500).json({ error: 'Failed to create draft result' });
  }
});

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
                FROM ${schemaPrefix}fl_draft_results dr
                JOIN ${schemaPrefix}fl_players p ON dr.player_id = p.player_id
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

// Players
app.get('/api/players', async (req, res) => {
  try {
    const { position, team, teamId } = req.query;
    
    let query = `SELECT * FROM ${schemaPrefix}fl_players`;
    const params = [];
    const conditions = [];
    
    if (position) {
      // Handle position filter based on the boolean fields
      switch(position) {
        case 'P':
          conditions.push('bln_p = true');
          break;
        case 'C':
          conditions.push('bln_c = true');
          break;
        case '1B':
          conditions.push('bln_1b = true');
          break;
        case '2B':
          conditions.push('bln_2b = true');
          break;
        case 'SS':
          conditions.push('bln_ss = true');
          break;
        case '3B':
          conditions.push('bln_3b = true');
          break;
        case 'OF':
          conditions.push('bln_of = true');
          break;
        case 'UTIL':
          conditions.push('bln_u = true');
          break;
      }
    }
    
    if (teamId) {
      params.push(teamId);
      conditions.push(`team_id = $${params.length}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const result = await pool.query(query, params);
    
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
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.get('/api/players/search', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.json([]);
    }
    
    const result = await pool.query(
      `SELECT * FROM ${schemaPrefix}fl_players 
       WHERE player_first_name ILIKE $1 
       OR player_last_name ILIKE $1`,
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

app.get('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM ${schemaPrefix}fl_players WHERE player_id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const player = result.rows[0];
    
    // Map the boolean position flags to a position string for the API
    let position = '';
    if (player.bln_p) position = 'P';
    else if (player.bln_c) position = 'C';
    else if (player.bln_1b) position = '1B';
    else if (player.bln_2b) position = '2B';
    else if (player.bln_ss) position = 'SS';
    else if (player.bln_3b) position = '3B';
    else if (player.bln_of) position = 'OF';
    else if (player.bln_u) position = 'UTIL';
    
    res.json({
      ...player,
      position,
      name: `${player.player_first_name} ${player.player_last_name}`
    });
  } catch (error) {
    console.error(`Error fetching player ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { 
      team_id, player_first_name, player_last_name, 
      player_api_lookup, position, py_mlb_lookup 
    } = req.body;
    
    // Map the position to the boolean fields
    const positionFlags = {
      bln_p: position === 'P',
      bln_c: position === 'C',
      bln_1b: position === '1B',
      bln_2b: position === '2B',
      bln_ss: position === 'SS',
      bln_3b: position === '3B',
      bln_of: position === 'OF',
      bln_u: position === 'UTIL'
    };
    
    const result = await pool.query(
      `INSERT INTO ${schemaPrefix}fl_players (
        team_id, player_first_name, player_last_name, 
        player_api_lookup, bln_p, bln_c, bln_1b, 
        bln_2b, bln_ss, bln_3b, bln_of, bln_u, py_mlb_lookup
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING player_id`,
      [
        team_id, player_first_name, player_last_name, 
        player_api_lookup, positionFlags.bln_p, positionFlags.bln_c, 
        positionFlags.bln_1b, positionFlags.bln_2b, positionFlags.bln_ss, 
        positionFlags.bln_3b, positionFlags.bln_of, positionFlags.bln_u,
        py_mlb_lookup
      ]
    );
    
    res.status(201).json({ player_id: result.rows[0].player_id });
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      team_id, player_first_name, player_last_name, 
      player_api_lookup, position, py_mlb_lookup 
    } = req.body;
    
    // Map the position to the boolean fields
    const positionFlags = {
      bln_p: position === 'P',
      bln_c: position === 'C',
      bln_1b: position === '1B',
      bln_2b: position === '2B',
      bln_ss: position === 'SS',
      bln_3b: position === '3B',
      bln_of: position === 'OF',
      bln_u: position === 'UTIL'
    };
    
    await pool.query(
      `UPDATE ${schemaPrefix}fl_players SET
        team_id = $1, 
        player_first_name = $2, 
        player_last_name = $3, 
        player_api_lookup = $4, 
        bln_p = $5, 
        bln_c = $6, 
        bln_1b = $7, 
        bln_2b = $8, 
        bln_ss = $9, 
        bln_3b = $10, 
        bln_of = $11, 
        bln_u = $12,
        py_mlb_lookup = $13
       WHERE player_id = $14`,
      [
        team_id, player_first_name, player_last_name, 
        player_api_lookup, positionFlags.bln_p, positionFlags.bln_c, 
        positionFlags.bln_1b, positionFlags.bln_2b, positionFlags.bln_ss, 
        positionFlags.bln_3b, positionFlags.bln_of, positionFlags.bln_u,
        py_mlb_lookup, id
      ]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Error updating player ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Sync players from MLB API to the database
app.post('/api/players/sync', async (req, res) => {
  try {
    const { players } = req.body;
    let count = 0;
    
    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const player of players) {
        // Check if player already exists by MLB ID
        const existingPlayer = await client.query(
          `SELECT player_id FROM ${schemaPrefix}fl_players WHERE py_mlb_lookup = $1`,
          [player.mlbId]
        );
        
        // Map position to boolean fields
        const positionFlags = {
          bln_p: player.position === 'P',
          bln_c: player.position === 'C',
          bln_1b: player.position === '1B',
          bln_2b: player.position === '2B',
          bln_ss: player.position === 'SS',
          bln_3b: player.position === '3B',
          bln_of: player.position === 'OF' || player.position === 'LF' || player.position === 'CF' || player.position === 'RF',
          bln_u: player.position === 'UTIL' || player.position === 'DH'
        };
        
        // Split name into first and last
        let firstName = '';
        let lastName = '';
        
        if (player.name) {
          const nameParts = player.name.split(' ');
          if (nameParts.length > 1) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else {
            lastName = player.name;
          }
        }
        
        if (existingPlayer.rows.length > 0) {
          // Update existing player
          await client.query(
            `UPDATE ${schemaPrefix}fl_players SET
              player_first_name = $1, 
              player_last_name = $2, 
              player_api_lookup = $3, 
              bln_p = $4, 
              bln_c = $5, 
              bln_1b = $6, 
              bln_2b = $7, 
              bln_ss = $8, 
              bln_3b = $9, 
              bln_of = $10, 
              bln_u = $11
             WHERE player_id = $12`,
            [
              firstName, 
              lastName, 
              player.mlbTeam || '', 
              positionFlags.bln_p, 
              positionFlags.bln_c, 
              positionFlags.bln_1b, 
              positionFlags.bln_2b, 
              positionFlags.bln_ss, 
              positionFlags.bln_3b, 
              positionFlags.bln_of, 
              positionFlags.bln_u,
              existingPlayer.rows[0].player_id
            ]
          );
        } else {
          // Insert new player
          await client.query(
            `INSERT INTO ${schemaPrefix}fl_players (
              player_first_name, player_last_name, player_api_lookup,
              bln_p, bln_c, bln_1b, bln_2b, bln_ss, bln_3b, bln_of, bln_u,
              py_mlb_lookup
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              firstName, 
              lastName, 
              player.mlbTeam || '', 
              positionFlags.bln_p, 
              positionFlags.bln_c, 
              positionFlags.bln_1b, 
              positionFlags.bln_2b, 
              positionFlags.bln_ss, 
              positionFlags.bln_3b, 
              positionFlags.bln_of, 
              positionFlags.bln_u,
              player.mlbId
            ]
          );
        }
        
        count++;
      }
      
      await client.query('COMMIT');
      res.json({ success: true, count });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error syncing players:', error);
    res.status(500).json({ error: 'Failed to sync players' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});