// src/api/api-client.js
// This is a sample of how to update your frontend API calls

import axios from 'axios';

// Create a base axios instance with relative URLs
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Example API functions
export const getTeams = async (currentYear = true) => {
  try {
    // Notice we're using relative URLs now
    const response = await api.get(`/teams?currentYear=${currentYear}`);
    return response.data;
  } catch (error) {
    console.error('Error getting teams:', error);
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

export const searchPlayers = async (term) => {
  try {
    const response = await api.get(`/player-search?term=${encodeURIComponent(term)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching players:', error);
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

// Additional functions following the same pattern...