import React, { useState, useEffect } from 'react';
import { getDraftPicks, addDraftPick, getTeams, getCurrentYear } from '../api/database';
import { searchPlayersByName } from '../api/mlb';

const DraftBoard = () => {
  // State declarations
  const [draftPicks, setDraftPicks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedRosterSlot, setSelectedRosterSlot] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [currentYear, setCurrentYear] = useState(null);

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get the current year
        const yearData = await getCurrentYear();
        setCurrentYear(yearData);
        
        // Get teams for the current year
        const teamsData = await getTeams();
        setTeams(teamsData);
        
        // Get draft picks
        const picks = await getDraftPicks();
        setDraftPicks(picks);
        
        setIsLoading(false);
        
        // Auto-select the team that's on the clock
        determineTeamOnClock(teamsData, picks);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Determine which team is on the clock
  const determineTeamOnClock = (teamsList, picksList) => {
    if (!teamsList || teamsList.length === 0) return;
    
    // Calculate the next pick number
    const nextPickNumber = picksList.length + 1;
    
    // Calculate the round number (1-based) and position in the round (0-based)
    const roundNumber = Math.ceil(nextPickNumber / teamsList.length);
    const positionInRound = (nextPickNumber - 1) % teamsList.length;
    
    // Get the team on the clock (snake draft format)
    let teamIndex;
    if (roundNumber % 2 === 1) {
      // Odd rounds go in ascending order by team_id
      teamIndex = positionInRound;
    } else {
      // Even rounds go in descending order by team_id
      teamIndex = teamsList.length - 1 - positionInRound;
    }
    
    // Sort teams by team_id
    const sortedTeams = [...teamsList].sort((a, b) => a.team_id - b.team_id);
    
    // Get the team on the clock
    const teamOnClock = sortedTeams[teamIndex];
    if (teamOnClock) {
      console.log(`Team on clock: ${teamOnClock.team_name} (Round ${roundNumber}, Pick ${nextPickNumber})`);
      setSelectedTeam(teamOnClock.team_id.toString());
    }
  };

  // Handle player search
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

  // Handle player selection
  const handleSelectPlayer = (player) => {
    // Store the selected player for drafting
    setSelectedPlayer(player);
    // Clear search results after selection
    setSearchResults([]);
    setSearchTerm('');
  };

  // Handle draft pick
  const handleMakePick = async () => {
    if (!selectedTeam || !selectedPlayer) {
      alert("Please select both a team and a player.");
      return;
    }
    
    if (!selectedRosterSlot) {
      alert("Please select a roster slot for this player.");
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
        roster_position: selectedRosterSlot // Use the selected roster slot
      };
      
      console.log("Drafting player with data:", pickData);
      
      const result = await addDraftPick(pickData);
      console.log("Draft result:", result);
      
      // Refresh draft picks after successful draft
      const updatedPicks = await getDraftPicks();
      setDraftPicks(updatedPicks);
      
      // Reset selections
      setSelectedPlayer(null);
      setSelectedRosterSlot('');
      
      // Auto-select the next team on the clock
      determineTeamOnClock(teams, updatedPicks);
      
      // Success message is now logged to console instead of showing an alert
      console.log(`Player drafted: ${result.message || 'Success!'}`);
    } catch (error) {
      console.error('Error making draft pick:', error);
      alert(`Error drafting player: ${error.message || 'Please try again.'}`);
    }
  };

  // Render draft order
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

  // Render loading state
  if (isLoading) {
    return <div className="loading">Loading draft board...</div>;
  }

  // Render component
  return (
    <div className="draft-board-container">
      <div className="draft-header">
        <h2>Federal League Draft Board {currentYear?.year_name}</h2>
        {currentYear && <div className="year-info">Year ID: {currentYear.year_id}</div>}
      </div>
      
      <div className="draft-controls">
        <h3>Make Selection</h3>
        <div className="selection-form">
          <div className="form-group">
            <label htmlFor="team-select">Select Team:</label>
            <select 
              id="team-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">-- Select Team --</option>
              {teams && teams.map(team => (
                <option key={`team-${team.team_id}`} value={team.team_id}>{team.team_name}</option>
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
                
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="roster-slot-select">Select Roster Slot:</label>
                  <select 
                    id="roster-slot-select"
                    value={selectedRosterSlot}
                    onChange={(e) => setSelectedRosterSlot(e.target.value)}
                    className="roster-slot-select"
                  >
                    <option value="">-- Select Roster Slot --</option>
                    {/* Show appropriate slots based on player position */}
                    {selectedPlayer.position === 'P' && (
                      <>
                        <option value="P 1">P 1</option>
                        <option value="P 2">P 2</option>
                        <option value="P 3">P 3</option>
                        <option value="P 4">P 4</option>
                        <option value="P 5">P 5</option>
                        <option value="P 6">P 6</option>
                        <option value="P 7">P 7</option>
                      </>
                    )}
                    {selectedPlayer.position === 'C' && <option value="C">C</option>}
                    {selectedPlayer.position === '1B' && <option value="1B">1B</option>}
                    {selectedPlayer.position === '2B' && <option value="2B">2B</option>}
                    {selectedPlayer.position === '3B' && <option value="3B">3B</option>}
                    {selectedPlayer.position === 'SS' && <option value="SS">SS</option>}
                    {selectedPlayer.position === 'OF' && (
                      <>
                        <option value="OF 1">OF 1</option>
                        <option value="OF 2">OF 2</option>
                        <option value="OF 3">OF 3</option>
                      </>
                    )}
                    {/* Utility slots available for any position */}
                    <option value="U 1">U 1</option>
                    <option value="U 2">U 2</option>
                    <option value="U 3">U 3</option>
                    {/* Taxi squad option */}
                    <option value="Taxi">Taxi Squad</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          <button 
            className="make-pick-button"
            onClick={handleMakePick}
            disabled={!selectedTeam || !selectedPlayer || !selectedRosterSlot}
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