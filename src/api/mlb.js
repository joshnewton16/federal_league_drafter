import axios from 'axios';

// Base URL for MLB Stats API
const MLB_API_BASE_URL = 'https://statsapi.mlb.com/api/v1';

/**
 * Get all MLB teams
 * @returns {Promise<Array>} Array of MLB teams
 */
export const getMLBTeams = async () => {
  try {
    const response = await axios.get(`${MLB_API_BASE_URL}/teams?sportId=1`);
    return response.data.teams.map(team => ({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      teamName: team.teamName,
      locationName: team.locationName,
      division: team.division.name,
      league: team.league.name
    }));
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
    const response = await axios.get(`${MLB_API_BASE_URL}/people/${playerId}`);
    const player = response.data.people[0];
    
    // Get player stats
    const statsResponse = await axios.get(
      `${MLB_API_BASE_URL}/people/${playerId}/stats?stats=season&season=${new Date().getFullYear()}`
    );
    
    return {
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      fullName: player.fullName,
      position: player.primaryPosition.abbreviation,
      positionName: player.primaryPosition.name,
      number: player.primaryNumber || '',
      bats: player.batSide.code,
      throws: player.pitchHand.code,
      birthDate: player.birthDate,
      mlbTeamId: player.currentTeam?.id,
      mlbTeamName: player.currentTeam?.name,
      stats: statsResponse.data.stats[0]?.splits || []
    };
  } catch (error) {
    console.error(`Error fetching details for player ${playerId}:`, error);
    throw error;
  }
};

/**
 * Search for players by name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching players
 */
export const searchPlayersByName = async (query) => {
  try {
    const response = await axios.get(`${MLB_API_BASE_URL}/players?season=${new Date().getFullYear()}&names=${query}`);
    
    // Get detailed information for each player
    const playerPromises = response.data.people.map(player => 
      getPlayerDetails(player.id)
    );
    
    return Promise.all(playerPromises);
  } catch (error) {
    console.error(`Error searching for players with query "${query}":`, error);
    throw error;
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