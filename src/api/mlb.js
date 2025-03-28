import axios from 'axios';

// Use our backend as a proxy to the MLB Stats API
const API_BASE_URL = 'http://localhost:3001/api/mlb';

// Add an MLB teams proxy endpoint to the backend
export const getMLBTeams = async () => {
  try {
    // Use our database for teams instead of MLB API
    const response = await axios.get('/api/teams?currentYear=true');
    return response.data;
  } catch (error) {
    console.error('Error fetching MLB teams:', error);
    throw error;
  }
};

/**
 * Get active roster for a specific MLB team
 * @param {number} teamId - MLB team ID
 * @returns {Promise<Array>} Array of players on the team's active roster
 */
export const getTeamRoster = async (teamId) => {
  try {
    const response = await axios.get(`${MLB_API_BASE_URL}/teams/${teamId}/roster/active`);
    
    // Get detailed information for each player
    const playerPromises = response.data.roster.map(player => 
      getPlayerDetails(player.person.id)
    );
    
    return Promise.all(playerPromises);
  } catch (error) {
    console.error(`Error fetching roster for team ${teamId}:`, error);
    throw error;
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

/**
 * Search for players by name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching players
 */
export const searchPlayersByName = async (query) => {
  try {
    // Use our proxy endpoint instead of directly accessing MLB API
    const response = await axios.get(`${API_BASE_URL}/players`, {
      params: {
        names: query,
        season: new Date().getFullYear()
      }
    });
    
    // If no results or error from MLB, use our database as fallback
    if (!response.data.people || response.data.people.length === 0) {
      // Fallback to our database search
      console.log(`No MLB results for "${query}", falling back to database search`);
      const backendResponse = await axios.get(`/api/players/search?term=${encodeURIComponent(query)}`);
      return backendResponse.data;
    }
    
    // Get detailed information for each player from MLB API results
    return response.data.people.map(player => ({
      id: player.id,
      name: player.fullName,
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
      return backendResponse.data;
    } catch (fallbackError) {
      console.error('Fallback search also failed:', fallbackError);
      throw error;
    }
  }
};

/**
 * Get players from farm system (minor leagues)
 * @param {number} teamId - MLB team ID
 * @returns {Promise<Array>} Array of minor league players
 */
export const getMinorLeaguePlayers = async (teamId) => {
  try {
    // Get all affiliated minor league teams for this MLB team
    const response = await axios.get(`${MLB_API_BASE_URL}/teams/affiliates?teamIds=${teamId}`);
    const affiliateTeams = response.data.teams;
    
    // Get rosters for all affiliate teams
    const rosterPromises = affiliateTeams.map(team => 
      axios.get(`${MLB_API_BASE_URL}/teams/${team.id}/roster/fullRoster`)
        .then(response => response.data.roster || [])
    );
    
    const allRosters = await Promise.all(rosterPromises);
    const allPlayers = allRosters.flat();
    
    // Get detailed information for each player
    const playerPromises = allPlayers.map(player => 
      getPlayerDetails(player.person.id)
    );
    
    return Promise.all(playerPromises);
  } catch (error) {
    console.error(`Error fetching minor league players for team ${teamId}:`, error);
    throw error;
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
    const response = await axios.get(
      `${MLB_API_BASE_URL}/people/${playerId}/stats?stats=season&season=${season}&group=${statGroup}`
    );
    
    return response.data.stats[0]?.splits || [];
  } catch (error) {
    console.error(`Error fetching ${statGroup} stats for player ${playerId}:`, error);
    throw error;
  }
};

/**
 * Sync all active MLB players to the local database
 * @param {Function} savePlayerCallback - Function to save player to database
 * @returns {Promise<number>} Number of players synced
 */
export const syncMLBPlayersToDatabase = async (savePlayerCallback) => {
  try {
    // Get all MLB teams
    const teams = await getMLBTeams();
    let totalPlayers = 0;
    
    // For each team, get active roster and minor league players
    for (const team of teams) {
      // Get active roster
      const activeRoster = await getTeamRoster(team.id);
      
      // Save each player to the database
      for (const player of activeRoster) {
        await savePlayerCallback({
          ...player,
          isActive: true,
          isMinorLeague: false
        });
        totalPlayers++;
      }
      
      // Get minor league players
      const minorLeaguePlayers = await getMinorLeaguePlayers(team.id);
      
      // Save each minor league player to the database
      for (const player of minorLeaguePlayers) {
        await savePlayerCallback({
          ...player,
          isActive: false,
          isMinorLeague: true
        });
        totalPlayers++;
      }
    }
    
    return totalPlayers;
  } catch (error) {
    console.error('Error syncing MLB players to database:', error);
    throw error;
  }
};