import axios from 'axios';

// Base URL for your backend API that connects to PostgreSQL
const API_BASE_URL = 'http://localhost:3001/api';

// Teams operations
export const getTeams = async (yearId = null) => {
  try {
    // If no yearId is provided, get the current year
    let yearFilter = '';
    if (yearId) {
      yearFilter = `?yearId=${yearId}`;
    } else {
      yearFilter = '?currentYear=true'; // Parameter to get current year teams
    }
    
    const response = await axios.get(`${API_BASE_URL}/teams${yearFilter}`);
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

export const updateTeam = async (teamId, teamData) => {
  try {
    await axios.put(`${API_BASE_URL}/teams/${teamId}`, teamData);
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

// Draft picks operations
export const getDraftPicks = async (yearId = null) => {
  try {
    const yearParam = yearId ? `?yearId=${yearId}` : '';
    const response = await axios.get(`${API_BASE_URL}/draftResults${yearParam}`);
    return response.data;
  } catch (error) {
    console.error('Error getting draft picks:', error);
    throw error;
  }
};

export const addDraftPick = async (pickData) => {
  try {
    console.log("Sending draft pick data to server:", pickData);
    
    // Call the database function draft_player
    const response = await axios.post(`${API_BASE_URL}/draftPlayer`, {
      player_api_lookup: pickData.player_api_lookup,
      team_name: pickData.team_name,
      roster_position: pickData.roster_position || 'UTIL' // Default to UTIL if not specified
    });
    
    console.log("Server response:", response.data);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Unknown error drafting player');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error adding draft pick:', error);
    
    // Extract the most useful error message
    let errorMessage = 'Failed to draft player';
    
    if (error.response && error.response.data) {
      errorMessage = error.response.data.error || error.response.data.details || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

export const getTeamDraftPicks = async (teamId, yearId = null) => {
  try {
    const yearParam = yearId ? `?yearId=${yearId}` : '';
    const response = await axios.get(`${API_BASE_URL}/teams/${teamId}/draftResults${yearParam}`);
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

export const getCurrentYear = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/currentYear`);
    return response.data;
  } catch (error) {
    console.error('Error getting current year:', error);
    throw error;
  }
};