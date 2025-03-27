import axios from 'axios';

// Base URL for your backend API that connects to PostgreSQL
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Configure the API base URL
 * @param {string} baseUrl - New base URL for the API
 */
export const configureApiUrl = (baseUrl) => {
  API_BASE_URL = baseUrl;
};

// Teams operations
export const getTeams = async (yearId = new Date().getFullYear()) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/teams?yearId=${yearId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting teams:', error);
    throw error;
  }
};

export const getTeam = async (teamId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/teams/${teamId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting team:', error);
    throw error;
  }
};

export const addTeam = async (teamData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/teams`, teamData);
    return response.data.team_id;
  } catch (error) {
    console.error('Error adding team:', error);
    throw error;
  }
};

export const updateTeam = async (teamId, teamData) => {
  try {
    await axios.put(`${API_BASE_URL}/teams/${teamId}`, teamData);
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

// Draft picks operations
export const getDraftPicks = async (yearId = new Date().getFullYear()) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/draftResults?yearId=${yearId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting draft picks:', error);
    throw error;
  }
};

export const addDraftPick = async (pickData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/draftResults`, pickData);
    return response.data.draft_result_id;
  } catch (error) {
    console.error('Error adding draft pick:', error);
    throw error;
  }
};

export const updateDraftPick = async (pickId, pickData) => {
  try {
    await axios.put(`${API_BASE_URL}/draftResults/${pickId}`, pickData);
  } catch (error) {
    console.error('Error updating draft pick:', error);
    throw error;
  }
};

export const getTeamDraftPicks = async (teamId, yearId = new Date().getFullYear()) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/teams/${teamId}/draftResults?yearId=${yearId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting team draft picks:', error);
    throw error;
  }
};

// Players operations
export const getPlayers = async (filters = {}) => {
  try {
    // Convert filters to query parameters
    const queryParams = new URLSearchParams();
    
    if (filters.position) {
      queryParams.append('position', filters.position);
    }
    
    if (filters.team) {
      queryParams.append('team', filters.team);
    }
    
    if (filters.teamId) {
      queryParams.append('teamId', filters.teamId);
    }
    
    const url = `${API_BASE_URL}/players${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await axios.get(url);
    
    return response.data;
  } catch (error) {
    console.error('Error getting players:', error);
    throw error;
  }
};

export const searchPlayers = async (searchTerm) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/players/search?term=${encodeURIComponent(searchTerm)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching players:', error);
    throw error;
  }
};

export const getPlayerById = async (playerId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/players/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting player:', error);
    throw error;
  }
};

export const addPlayer = async (playerData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/players`, playerData);
    return response.data.player_id;
  } catch (error) {
    console.error('Error adding player:', error);
    throw error;
  }
};

export const updatePlayer = async (playerId, playerData) => {
  try {
    await axios.put(`${API_BASE_URL}/players/${playerId}`, playerData);
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
};

// Sync players from MLB API to local database
export const syncMLBPlayersToDatabase = async (players) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/players/sync`, { players });
    return response.data.count;
  } catch (error) {
    console.error('Error syncing MLB players to database:', error);
    throw error;
  }
};