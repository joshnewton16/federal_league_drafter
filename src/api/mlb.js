import axios from 'axios';

// Use our backend as a proxy to the MLB Stats API
const API_BASE_URL = 'http://localhost:3001/api/mlb';

/**
 * Search for players by name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching players
 */
export const searchPlayersByName = async (query) => {
  try {
    console.log(`Searching for player: ${query}`);
    
    // Use our proxy endpoint instead of directly accessing MLB API
    const response = await axios.get(`${API_BASE_URL}/players`, {
      params: {
        names: query,
        season: new Date().getFullYear()
      }
    });
    
    console.log('MLB API response:', response.data);
    
    // If no results or error from MLB, use our database as fallback
    if (!response.data.people || response.data.people.length === 0) {
      // Fallback to our database search
      console.log(`No MLB results for "${query}", falling back to database search`);
      const backendResponse = await axios.get(`/api/players/search?term=${encodeURIComponent(query)}`);
      console.log('Database search results:', backendResponse.data);
      return backendResponse.data;
    }
    
    // Map MLB API results to a consistent format
    return response.data.people.map(player => ({
      id: player.id,
      name: player.fullName,
      fullName: player.fullName,
      position: player.primaryPosition?.abbreviation || '',
      mlbTeam: player.currentTeam?.name || '',
      player_api_lookup: player.fullName, // For our database function
      mlbId: player.id
    }));
  } catch (error) {
    console.error(`Error searching for players with query "${query}":`, error);
    
    // Fallback to our database search on error
    try {
      console.log(`MLB API error for "${query}", falling back to database search`);
      const backendResponse = await axios.get(`/api/players/search?term=${encodeURIComponent(query)}`);
      console.log('Database fallback results:', backendResponse.data);
      return backendResponse.data;
    } catch (fallbackError) {
      console.error('Fallback search also failed:', fallbackError);
      return []; // Return empty array instead of throwing
    }
  }
};

/**
 * Get detailed information for a specific player
 * @param {number} playerId - MLB player ID
 * @returns {Promise<Object>} Player details
 */
export const getPlayerDetails = async (playerId) => {
  try {
    // Use our proxy endpoint
    const response = await axios.get(`${API_BASE_URL}/players/${playerId}`);
    
    // Check if we got a fallback response from our database
    if (response.data.fallback) {
      const player = response.data.player;
      
      // Format the player data to match what we expect
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
        py_mlb_lookup: player.py_mlb_lookup,
        name: `${player.player_first_name} ${player.player_last_name}`,
        fullName: `${player.player_first_name} ${player.player_last_name}`,
        position: position,
        positionName: position,
        player_api_lookup: player.player_api_lookup,
        mlbTeam: player.player_api_lookup
      };
    }
    
    // Process regular MLB API response
    if (!response.data.people || response.data.people.length === 0) {
      throw new Error(`No player found with ID ${playerId}`);
    }
    
    const player = response.data.people[0];
    
    return {
      id: player.id,
      name: player.fullName,
      fullName: player.fullName,
      position: player.primaryPosition?.abbreviation || '',
      positionName: player.primaryPosition?.name || '',
      number: player.primaryNumber || '',
      bats: player.batSide?.code || '',
      throws: player.pitchHand?.code || '',
      birthDate: player.birthDate,
      mlbTeamId: player.currentTeam?.id,
      mlbTeamName: player.currentTeam?.name,
      player_api_lookup: player.fullName // For our database function
    };
  } catch (error) {
    console.error(`Error fetching details for player ${playerId}:`, error);
    
    // Return minimal player data if we can't get details
    return {
      id: playerId,
      name: 'Unknown Player',
      fullName: 'Unknown Player',
      position: '',
      player_api_lookup: `Player ID: ${playerId}`
    };
  }
};

// Simplified version of team functions
export const getMLBTeams = async () => {
  try {
    // Use our database for teams instead of MLB API
    const response = await axios.get('/api/teams?currentYear=true');
    return response.data;
  } catch (error) {
    console.error('Error fetching MLB teams:', error);
    return [];
  }
};

/**
 * Get player stats
 * @param {number} playerId - MLB player ID
 * @param {string} statGroup - Type of stats (hitting, pitching, fielding)
 * @param {number} season - Season year
 * @returns {Promise<Object>} Player stats
 */
export const getPlayerStats = async (playerId, statGroup = 'hitting', season = new Date().getFullYear()) => {
  try {
    // We'll create a proxy endpoint for this in the backend later
    // For now, return a mock response
    console.log(`Getting ${statGroup} stats for player ${playerId} for season ${season}`);
    
    // Create mock data based on stat group
    if (statGroup === 'hitting') {
      return [{
        stat: {
          avg: 0.275,
          homeRuns: 15,
          rbi: 65,
          runs: 70,
          stolenBases: 5,
          obp: 0.350,
          slg: 0.450,
          ops: 0.800,
          atBats: 500,
          hits: 137
        }
      }];
    } else if (statGroup === 'pitching') {
      return [{
        stat: {
          wins: 10,
          losses: 8,
          era: 3.75,
          gamesPlayed: 30,
          gamesStarted: 25,
          saves: 0,
          inningsPitched: 180.2,
          strikeOuts: 170,
          baseOnBalls: 60,
          whip: 1.25
        }
      }];
    } else {
      return [];
    }
  } catch (error) {
    console.error(`Error fetching ${statGroup} stats for player ${playerId}:`, error);
    return [];
  }
};