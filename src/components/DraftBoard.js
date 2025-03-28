{selectedPlayer && (
  <div className="selected-player">
    <h3>Selected Player:</h3>
    <div className="player-card">
      <div className="player-name">
        {selectedPlayer.fullName || selectedPlayer.name || 
         `${selectedPlayer.player_first_name || ''} ${selectedPlayer.player_last_name || ''}`.trim() ||
         'Unknown Player'}
      </div>
      <div className="player-details">
        <div>Position: {selectedPlayer.position || selectedPlayer.positionName || 'Unknown'}</div>
        <div>Team: {selectedPlayer.mlbTeamName || selectedPlayer.mlbTeam || 
                    selectedPlayer.player_api_lookup || 'Unknown'}</div>
        {selectedPlayer.bats && <div>Bats: {selectedPlayer.bats}</div>}
        {selectedPlayer.throws && <div>Throws: {selectedPlayer.throws}</div>}
        {selectedPlayer.id && <div>Player ID: {selectedPlayer.id || selectedPlayer.player_id}</div>}
      </div>
    </div>
  </div>
)}import React, { useState, useEffect } from 'react';
import { getDraftPicks, addDraftPick, getTeams, getCurrentYear } from '../api/database';
import { searchPlayersByName } from '../api/mlb';

const DraftBoard = () => {
// Initialize state variables
const [draftPicks, setDraftPicks] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);
const [selectedTeam, setSelectedTeam] = useState('');
const [selectedPlayer, setSelectedPlayer] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [teams, setTeams] = useState([]);
const [currentYear, setCurrentYear] = useState(null);

useEffect(() => {
// Load draft picks on component mount
const loadDraftPicks = async () => {
try {
const picks = await getDraftPicks();
setDraftPicks(picks);
setIsLoading(false);
} catch (error) {
console.error('Error loading draft picks:', error);
setIsLoading(false);
}
};

// Load teams on component mount
const loadTeams = async () => {
try {
// Get teams for the current year (where current_yr is true)
const teamsData = await getTeams();

// Teams are already sorted by team_id from the API
setTeams(teamsData);
} catch (error) {
console.error('Error loading teams:', error);
}
};

loadDraftPicks();
loadTeams();
}, []);

const handleSearch = async () => {
if (!searchTerm.trim()) return;

setIsSearching(true);
setSearchResults([]);

try {
// First try MLB API via our proxy
const players = await searchPlayersByName(searchTerm);

if (players && players.length > 0) {
setSearchResults(players);
} else {
console.log('No players found for search term:', searchTerm);
}
} catch (error) {
console.error('Error searching players:', error);
// Don't set an empty array here, keep previous results if any
} finally {
setIsSearching(false);
}
};

const handleSelectPlayer = (player) => {
// Store the selected player for drafting
setSelectedPlayer(player);
// Clear search results after selection
setSearchResults([]);
setSearchTerm('');
};

const handleMakePick = async () => {
if (!selectedTeam || !selectedPlayer) {
alert("Please select both a team and a player.");
return;
}

try {
// Get the team name from the selected team ID
const team = teams.find(t => t.team_id.toString() === selectedTeam.toString());

if (!team) {
console.error('Selected team not found');
alert("Error: Selected team not found.");
return;
}

// For player_api_lookup, use the most specific identifier available
const playerLookup = selectedPlayer.player_api_lookup || 
                selectedPlayer.name || 
                selectedPlayer.fullName || 
                `${selectedPlayer.player_first_name || ''} ${selectedPlayer.player_last_name || ''}`.trim();

if (!playerLookup) {
alert("Error: Unable to identify selected player.");
return;
}

// Draft player using the database function
const pickData = {
player_api_lookup: playerLookup,
team_name: team.team_name,
roster_position: selectedPlayer.position || 'UTIL' // Default to UTIL if position not specified
};

console.log("Drafting player with data:", pickData);

const result = await addDraftPick(pickData);
console.log("Draft result:", result);

// Refresh draft picks after successful draft
const updatedPicks = await getDraftPicks();
setDraftPicks(updatedPicks);

// Reset selections
setSelectedPlayer(null);
setSelectedTeam('');

// Show success message
alert(`Player drafted: ${result.message || 'Success!'}`);
} catch (error) {
console.error('Error making draft pick:', error);
alert(`Error drafting player: ${error.message || 'Please try again.'}`);
}
};

const renderDraftOrder = () => {
const totalRounds = 25; // Example: 25 rounds in the draft
const rounds = [];

// Early return if teams aren't loaded yet
if (!teams || teams.length === 0) {
return <div>Loading teams...</div>;
}

// Group draft picks by team
const picksByTeam = {};
draftPicks.forEach(pick => {
if (!picksByTeam[pick.team_id]) {
picksByTeam[pick.team_id] = [];
}
picksByTeam[pick.team_id].push(pick);
});

for (let round = 1; round <= totalRounds; round++) {
const roundPicks = [];

for (let i = 0; i < teams.length; i++) {
const team = teams[i];
const pickNumber = (round - 1) * teams.length + i + 1;

// Get the pick for this team and round
const teamPicks = picksByTeam[team.team_id] || [];
const pick = teamPicks[round - 1]; // 0-based index, round is 1-based

// Find player details if there's a pick
let playerName = '';
let playerPosition = '';
let playerTeam = '';

if (pick) {
// Try to get player details from the pick
if (pick.player_first_name && pick.player_last_name) {
  playerName = `${pick.player_first_name} ${pick.player_last_name}`;
} else if (pick.player_name) {
  playerName = pick.player_name;
} else {
  playerName = `Pick #${pickNumber}`;
}

playerPosition = pick.position || '';
playerTeam = pick.mlb_team || pick.player_api_lookup || '';
}

roundPicks.push(
<div key={`pick-${team.team_id}-${round}`} className="draft-pick">
  <div className="pick-number">{pickNumber}</div>
  <div className="team-name">{team.team_name}</div>
  {pick ? (
    <div className="player-selected">
      <div className="player-name">{playerName}</div>
      <div className="player-details">
        {playerPosition} {playerTeam ? `| ${playerTeam}` : ''}
      </div>
    </div>
  ) : (
    <div className="pick-empty">On the clock</div>
  )}
</div>
);
}

rounds.push(
<div key={`round-${round}`} className="draft-round">
<h3>Round {round}</h3>
<div className="round-picks">{roundPicks}</div>
</div>
);
}

return rounds;
};

if (isLoading) {
return <div className="loading">Loading draft board...</div>;
}

return (
<div className="draft-board-container">
<div className="draft-controls">
<h2>Make Selection</h2>
<div className="selection-form">
<div className="form-group">
  <label htmlFor="team-select">Select Team:</label>
  <select 
    id="team-select"
    value={selectedTeam}
    onChange={(e) => setSelectedTeam(e.target.value)}
  >
    <option value="">-- Select Team --</option>
    {teams.map(team => (
      <option key={team.id} value={team.id}>{team.name}</option>
    ))}
  </select>
</div>

<div className="form-group">
  <label htmlFor="player-search">Search Player:</label>
  <div className="search-container">
    <input 
      id="player-search"
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Enter player name"
      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
    />
    <button 
      className="search-button"
      onClick={handleSearch}
      disabled={isSearching}
    >
      {isSearching ? 'Searching...' : 'Search'}
    </button>
  </div>
  
  {searchResults.length > 0 && (
    <div className="search-results">
      <h4>Search Results ({searchResults.length})</h4>
      {searchResults.map((player, index) => {
        // Get player name from the available fields
        const playerName = player.fullName || player.name || 
          `${player.player_first_name || ''} ${player.player_last_name || ''}`.trim();
        
        // Get player position
        const position = player.position || '';
        
        // Get player team 
        const teamName = player.mlbTeam || player.mlbTeamName || player.player_api_lookup || '';
        
        return (
          <div 
            key={`search-result-${player.id || player.player_id || index}`} 
            className="search-result-item"
            onClick={() => handleSelectPlayer(player)}
          >
            <div className="player-name">{playerName}</div>
            <div className="player-details">
              {position} {teamName ? `| ${teamName}` : ''}
            </div>
          </div>
        );
      })}
    </div>
  )}
  
  {isSearching && <div className="searching-message">Searching...</div>}
  
  {!isSearching && searchTerm && searchResults.length === 0 && (
    <div className="no-results">No players found matching "{searchTerm}"</div>
  )}
</div>

{selectedPlayer && (
  <div className="selected-player">
    <h3>Selected Player:</h3>
    <div className="player-card">
      <div className="player-name">{selectedPlayer.fullName}</div>
      <div className="player-details">
        <div>Position: {selectedPlayer.position}</div>
        <div>Team: {selectedPlayer.mlbTeamName || 'Free Agent'}</div>
        <div>Bats: {selectedPlayer.bats} | Throws: {selectedPlayer.throws}</div>
      </div>
    </div>
  </div>
)}

<button 
  className="make-pick-button"
  onClick={handleMakePick}
  disabled={!selectedTeam || !selectedPlayer}
>
  Make Selection
</button>
</div>
</div>

<div className="draft-board">
<h2>Draft Board</h2>
{renderDraftOrder()}
</div>
</div>
);
};

export default DraftBoard;