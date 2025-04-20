// src/api/api-client.js
import axios from 'axios';

const baseURL = window.runtimeConfig?.apiBaseUrl || '/api';
console.log('Runtime config API URL:', window.runtimeConfig?.apiBaseUrl);
console.log('Using API base URL:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log all requests in development
if (!baseURL === '/api') {
  api.interceptors.request.use(request => {
    console.log('API Request:', request.method.toUpperCase(), request.url);
    return request;
  });
  
  api.interceptors.response.use(
    response => {
      console.log('API Response:', response.status, response.config.url);
      return response;
    },
    error => {
      console.error('API Error:', error.message, error.response?.status, error.config?.url);
      return Promise.reject(error);
    }
  );
}

// API methods
export const getTeams = async (currentYear = true) => {
  try {
    const response = await api.get(`/teams`, { params: { currentYear } });
    return response.data;
  } catch (error) {
    console.error('Error getting teams:', error);
    throw error;
  }
};

export const getCurrentYear = async () => {
  try {
    const response = await api.get('/currentYear');
    return response.data;
  } catch (error) {
    console.error('Error getting current year:', error);
    throw error;
  }
};

export const getDraftResults = async (yearId) => {
  try {
    const response = await api.get('/draftResults', { params: { yearId } });
    return response.data;
  } catch (error) {
    console.error('Error getting draft results:', error);
    throw error;
  }
};

export const draftPlayer = async (playerApiLookup, teamName, rosterPosition) => {
  try {
    const response = await api.post('/draftPlayer', {
      player_api_lookup: playerApiLookup,
      team_name: teamName,
      roster_position: rosterPosition
    });
    return response.data;
  } catch (error) {
    console.error('Error drafting player:', error);
    throw error;
  }
};

export const getTeamById = async (teamId) => {
  try {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting team ${teamId}:`, error);
    throw error;
  }
};

export const getTeamDraftResults = async (teamId, yearId) => {
  try {
    const response = await api.get(`/teams/${teamId}/draftResults`, { params: { yearId } });
    return response.data;
  } catch (error) {
    console.error(`Error getting draft results for team ${teamId}:`, error);
    throw error;
  }
};

export const searchPlayers = async (term) => {
  try {
    const response = await api.get('/player-search', { params: { term } });
    return response.data;
  } catch (error) {
    console.error('Error searching players:', error);
    throw error;
  }
};

export const getLeaderBoard = async () => {
  try {
    const response = await api.get('/leaderBoard');
    return response.data;
  } catch (error) {
    console.error('Error getting leaderBoard:', error);
    throw error;
  }
};

export const getLeagueDates = async () => {
  try {
    const response = await api.get('/leagueDates');
    return response.data;
  } catch (error) {
    console.error('Error getting leagueDates:', error);
    throw error;
  }
};

export const getTeamRoster = async (teamId) => {
  try {
    const response = await fetch(`/team-roster/${teamId}`);
    return response.data;
  } catch (error) {
    console.error(`Error in getTeamRoster for team ${teamId}:`, error);
    return [];
  }
};

export default api;