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
    if (!query || query.trim() === '') {
      return [];
    }
    
    const searchTerm = query.trim();
    console.log(`Searching for player: "${searchTerm}" using combined endpoint`);
    
    // Use the combined search endpoint
    const response = await axios.get(`http://localhost:3001/api/player-search`, {
      params: { term: searchTerm }
    });
    
    console.log('Combined search response:', response.data);
    
    if (response.data && response.data.players && Array.isArray(response.data.players)) {
      if (response.data.players.length > 0) {
        console.log(`Found ${response.data.players.length} players in combined search`);
        
        // Do an additional filter on the client side to ensure we're getting relevant results
        const filteredPlayers = response.data.players.filter(player => {
          const fullName = (player.fullName || '').toLowerCase();
          const firstName = (player.firstName || '').toLowerCase();
          const lastName = (player.lastName || '').toLowerCase();
          const searchTermLower = searchTerm.toLowerCase();
          
          return fullName.includes(searchTermLower) || 
                firstName.includes(searchTermLower) || 
                lastName.includes(searchTermLower);
        });
        
        console.log(`Filtered to ${filteredPlayers.length} relevant players`);
        
        // Process player data to ensure consistent format
        return filteredPlayers.map(player => ({
          ...player,
          // Ensure these fields exist with defaults if not present
          id: player.id || 0,
          fullName: player.fullName || '',
          position: player.position || '',
          mlbTeam: player.mlbTeam || '',
          player_api_lookup: player.player_api_lookup || player.fullName || '',
          source: player.source || 'Unknown'
        }));
      }
    }
    
    console.log(`No results found for: "${searchTerm}"`);
    return [];
  } catch (error) {
    console.error(`Error searching for players with query "${query}":`, error);
    return []; // Return empty array instead of throwing error
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
export const getMlbTeams = async () => {
  try {
    const response = await fetch(`http://localhost:3001/api/mlb/teams`);
    if (!response.ok) {
      throw new Error('Failed to fetch MLB teams');
    }
    const data = await response.json();
    return data.teams || [];
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

export const searchMinorLeaguePlayers = async (mlbTeamId) => {
  try {
    const response = await fetch(`http://localhost:3001/api/mlb/affiliates/${mlbTeamId}/players`);
    if (!response.ok) {
      throw new Error('Failed to fetch minor league players');
    }
    const data = await response.json();
    return data.players || [];
  } catch (error) {
    console.error('Error fetching minor league players:', error);
    return [];
  }
};