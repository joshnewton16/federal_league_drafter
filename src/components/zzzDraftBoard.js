import React, { useState, useEffect } from 'react';
import { getDraftPicks, addDraftPick, getTeams, getCurrentYear, getTeamRoster } from '../api/api-client';
import { searchPlayersByName, getMlbTeams, searchMinorLeaguePlayers } from '../api/mlb';

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
  const [draftedPlayers, setDraftedPlayers] = useState(new Set());
  const [filledRosterSlots, setFilledRosterSlots] = useState({});
  const [searchMode, setSearchMode] = useState('mlb'); // 'mlb' or 'milb'
  const [mlbTeams, setMlbTeams] = useState([]);
  const [selectedMlbTeam, setSelectedMlbTeam] = useState('');
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

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
        
        // Process existing picks to track drafted players
        processExistingPicks(picks, teamsData);
  
        // NEW CODE: Process filled roster slots from draft picks
        const filledSlots = {};
        
        // Initialize empty sets for all teams
        teamsData.forEach(team => {
          filledSlots[team.team_id] = new Set();
        });
        
        // Fill slots based on existing draft picks
        picks.forEach(pick => {
          if (pick.team_id && pick.roster_position) {
            console.log(`Adding filled slot for team ${pick.team_id}: ${pick.roster_position}`);
            filledSlots[pick.team_id].add(pick.roster_position);
          }
        });
        
        // Update filled roster slots
        console.log('Setting filled roster slots from draft picks:', filledSlots);
        setFilledRosterSlots(filledSlots);
        
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

  useEffect(() => {
    console.log('Team selection changed to:', selectedTeam);
    
    if (!selectedTeam) {
      console.log('No team selected, skipping roster load');
      return;
    }
    
    // Simple test to ensure the effect is running
    console.log('Effect is running for team ID:', selectedTeam);
    
    const loadTeamRoster = async () => {
      try {
        console.log('Fetching roster for team ID:', selectedTeam);
        const roster = await getTeamRoster(selectedTeam);
        console.log('Received roster data:', roster);
        
        // Create a copy of the current filled slots
        const updatedFilledSlots = { ...filledRosterSlots };
        
        // Initialize or reset the set for this team
        updatedFilledSlots[selectedTeam] = new Set();
        
        // Add each filled slot from the roster data
        roster.forEach(player => {
          if (player.roster_slot_name) {
            console.log(`Adding filled slot for team ${selectedTeam}: ${player.roster_slot_name}`);
            updatedFilledSlots[selectedTeam].add(player.roster_slot_name);
          }
        });
        
        // Update the state with the new filled slots information
        setFilledRosterSlots(updatedFilledSlots);
        console.log('Updated filled roster slots:', updatedFilledSlots);
      } catch (error) {
        console.error('Error loading team roster:', error);
      }
    };
    
    loadTeamRoster();
  }, [selectedTeam]); // Only depend on selectedTeam

  useEffect(() => {
    // Only load MLB teams if in milb search mode
    if (searchMode === 'milb') {
      const loadMlbTeams = async () => {
        setIsLoadingTeams(true);
        try {
          const teams = await getMlbTeams();

          // Sort teams alphabetically by name
          const sortedTeams = [...teams].sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          setMlbTeams(teams);
        } catch (error) {
          console.error('Error loading MLB teams:', error);
        } finally {
          setIsLoadingTeams(false);
        }
      };
      
      loadMlbTeams();
    }
  }, [searchMode]);
  
  // Process existing picks to track drafted players and filled roster slots
  const processExistingPicks = (picks, teamsList) => {
    // Create set of already drafted players
    const draftedPlayerIds = new Set();
    console.log('picks:',picks);
    console.log('teamsList: ', teamsList);
    
    // Create object to track filled roster slots by team
    const filledSlots = {};
    
    // Initialize filled slots object for each team
    teamsList.forEach(team => {
      filledSlots[team.team_id] = new Set();
    });
    
    // Process each draft pick
    picks.forEach(pick => {
      // Add player to drafted players set
      if (pick.player_id) {
        draftedPlayerIds.add(pick.player_id.toString());
      }
      
      if (pick.player_api_lookup) {
        draftedPlayerIds.add(pick.player_api_lookup);
      }
      
      // Add roster slot to filled slots for the team
      if (pick.team_id && pick.roster_position) {
        if (!filledSlots[pick.team_id]) {
          filledSlots[pick.team_id] = new Set();
        }
        filledSlots[pick.team_id].add(pick.roster_position);
      }
    });
    
    // Update state
    setDraftedPlayers(draftedPlayerIds);
    setFilledRosterSlots(filledSlots);
    
    console.log('Drafted players:', draftedPlayerIds);
    console.log('Filled roster slots:', filledSlots);
  };
  
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
    if (searchMode === 'milb' && !selectedMlbTeam) {
      alert('Please select an MLB team to search their minor league players');
      return;
    }
    
    if (searchMode === 'mlb' && !searchTerm.trim()) {
      return;
    }
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      let players = [];
      
      if (searchMode === 'mlb') {
        // Use existing search logic for MLB players
        players = await searchPlayersByName(searchTerm);
      } else {
        // Search minor league players by MLB parent team
        players = await searchMinorLeaguePlayers(selectedMlbTeam);
        
        // Optionally filter by name if searchTerm is provided
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          players = players.filter(player => 
            player.fullName.toLowerCase().includes(term)
          );
        }
      }
      
      if (players && players.length > 0) {
        // Filter out MLB players if database players are available (only in MLB mode)
        if (searchMode === 'mlb') {
          const dbPlayers = players.filter(player => player.source === 'Database');
          
          if (dbPlayers.length > 0) {
            console.log('Found players in database - using only database results');
            setSearchResults(dbPlayers);
          } else {
            console.log('No database players found - using MLB API results');
            setSearchResults(players);
          }
        } else {
          // In MiLB mode, show all results
          setSearchResults(players);
        }
      } else {
        console.log('No players found for search criteria');
      }
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Get eligible positions for a player
  const getPlayerEligiblePositions = (player) => {
    // If the player already has eligiblePositions array from the API, use it
    if (player.eligiblePositions && Array.isArray(player.eligiblePositions)) {
      return player.eligiblePositions;
    }
    
    // Determine if player is from MLB API or database
    const isFromMlbApi = player.source === 'MLB API' || (player.id && !player.player_id);
    
    if (isFromMlbApi) {
      // MLB API players - use their single position
      const position = player.position || 
                       (player.primaryPosition ? player.primaryPosition.abbreviation : null);
      
      return position ? [position] : [];
    } else {
      // Database players - check for boolean flags
      const positions = [];
      
      // Check each boolean flag directly
      if (player.bln_p) positions.push('P');
      if (player.bln_c) positions.push('C');
      if (player.bln_1b) positions.push('1B');
      if (player.bln_2b) positions.push('2B');
      if (player.bln_ss) positions.push('SS');
      if (player.bln_3b) positions.push('3B');
      if (player.bln_of) positions.push('OF');
      
      // If we found positions from boolean flags, return them
      if (positions.length > 0) {
        return positions;
      }
      
      // Otherwise, fall back to the single position if available
      if (player.position) {
        return [player.position];
      }
      
      // If all else fails, return empty array
      return [];
    }
  };

  // Check if player is already drafted
  const isPlayerDrafted = (player) => {
    if (!player) return false;
    
    // Check by player_id for database players
    if (player.player_id && draftedPlayers.has(player.player_id.toString())) {
      return true;
    }
    
    // Check by MLB ID for MLB API players
    if (player.id && draftedPlayers.has(player.id.toString())) {
      return true;
    }
    
    // Check by player_api_lookup
    if (player.player_api_lookup && draftedPlayers.has(player.player_api_lookup)) {
      return true;
    }
    
    // Check by fullName as last resort
    if (player.fullName && draftedPlayers.has(player.fullName)) {
      return true;
    }
    
    return false;
  };

  // Handle player selection
  const handleSelectPlayer = (player) => {
    // Store the selected player for drafting
    setSelectedPlayer(player);
    
    // Reset roster slot
    setSelectedRosterSlot('');
    
    // Log eligible positions for debugging
    const positions = getPlayerEligiblePositions(player);
    console.log(`Player eligible positions: ${positions.join(', ') || 'None'}`);
    
    // Clear search results after selection
    setSearchResults([]);
    setSearchTerm('');
  };

  // Render roster slot options based on the player's eligible positions
  const renderRosterSlotOptions = () => {
    if (!selectedPlayer || !selectedTeam) return null;
    
    // Get eligible positions for this player
    const eligiblePositions = getPlayerEligiblePositions(selectedPlayer);
    
    // Get filled slots for the selected team
    const teamFilledSlots = filledRosterSlots[selectedTeam] || new Set();
    
    // Determine if player is a pitcher
    const isPitcher = eligiblePositions.includes('P');
    
    return (
      <>
        {/* Position slots based on eligibility */}
        {eligiblePositions.includes('P') && (
          <>
            {!teamFilledSlots.has('P 1') && <option value="P 1">P 1</option>}
            {!teamFilledSlots.has('P 2') && <option value="P 2">P 2</option>}
            {!teamFilledSlots.has('P 3') && <option value="P 3">P 3</option>}
            {!teamFilledSlots.has('P 4') && <option value="P 4">P 4</option>}
            {!teamFilledSlots.has('P 5') && <option value="P 5">P 5</option>}
            {!teamFilledSlots.has('P 6') && <option value="P 6">P 6</option>}
            {!teamFilledSlots.has('P 7') && <option value="P 7">P 7</option>}
          </>
        )}
        
        {eligiblePositions.includes('C') && !teamFilledSlots.has('C') && <option value="C">C</option>}
        {eligiblePositions.includes('1B') && !teamFilledSlots.has('1B') && <option value="1B">1B</option>}
        {eligiblePositions.includes('2B') && !teamFilledSlots.has('2B') && <option value="2B">2B</option>}
        {eligiblePositions.includes('3B') && !teamFilledSlots.has('3B') && <option value="3B">3B</option>}
        {eligiblePositions.includes('SS') && !teamFilledSlots.has('SS') && <option value="SS">SS</option>}
        
        {(eligiblePositions.includes('OF') || 
          eligiblePositions.includes('LF') || 
          eligiblePositions.includes('CF') || 
          eligiblePositions.includes('RF')) && (
          <>
            {!teamFilledSlots.has('OF 1') && <option value="OF 1">OF 1</option>}
            {!teamFilledSlots.has('OF 2') && <option value="OF 2">OF 2</option>}
            {!teamFilledSlots.has('OF 3') && <option value="OF 3">OF 3</option>}
          </>
        )}
        
        {/* Utility slots available for all non-pitchers */}
        {!isPitcher && (
          <>
            {!teamFilledSlots.has('U 1') && <option value="U 1">U 1</option>}
            {!teamFilledSlots.has('U 2') && <option value="U 2">U 2</option>}
            {!teamFilledSlots.has('U 3') && <option value="U 3">U 3</option>}
          </>
        )}
        
        {/* Taxi squad available for all players */}
        {!teamFilledSlots.has('Taxi') && <option value="Taxi">Taxi Squad</option>}
      </>
    );
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
                          selectedPlayer.id || 
                          selectedPlayer.player_id || 
                          selectedPlayer.fullName || 
                          selectedPlayer.name || 
                          `${selectedPlayer.player_first_name || ''} ${selectedPlayer.player_last_name || ''}`.trim();
      
      if (!playerLookup) {
        alert("Error: Unable to identify selected player.");
        return;
      }
      
      // Check if roster slot is already filled
      if (filledRosterSlots[selectedTeam] && filledRosterSlots[selectedTeam].has(selectedRosterSlot)) {
        alert(`Error: Roster slot ${selectedRosterSlot} is already filled for this team.`);
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
      
      // Update drafted players and filled roster slots
      processExistingPicks(updatedPicks, teams);
      
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
            <div className="search-mode-toggle">
              <div className="search-mode-option">
                <input
                  type="radio"
                  id="mlb-search"
                  name="search-mode"
                  value="mlb"
                  checked={searchMode === 'mlb'}
                  onChange={() => setSearchMode('mlb')}
                />
                <label htmlFor="mlb-search">MLB Players</label>
              </div>
              <div className="search-mode-option">
                <input
                  type="radio"
                  id="milb-search"
                  name="search-mode"
                  value="milb"
                  checked={searchMode === 'milb'}
                  onChange={() => setSearchMode('milb')}
                />
                <label htmlFor="milb-search">Minor League Players</label>
              </div>
            </div>

            {searchMode === 'milb' && (
              <div className="mlb-team-selector">
                <label htmlFor="mlb-team-select">Select MLB Team:</label>
                <select
                  id="mlb-team-select"
                  value={selectedMlbTeam}
                  onChange={(e) => setSelectedMlbTeam(e.target.value)}
                  disabled={isLoadingTeams}
                >
                  <option value="">-- Select MLB Team --</option>
                  {mlbTeams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {isLoadingTeams && <span className="loading-indicator">Loading teams...</span>}
              </div>
            )}
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
                  // Check if player is already drafted
                  const drafted = isPlayerDrafted(player);
                  
                  // Get player name from the available fields
                  const playerName = player.fullName || player.name || 
                    `${player.player_first_name || ''} ${player.player_last_name || ''}`.trim();
                  
                  // Get player position
                  const position = player.position || 
                    (player.primaryPosition ? player.primaryPosition.abbreviation : '');
                  
                  // Get player team 
                  const teamName = player.mlbTeam || 
                    (player.currentTeam ? player.currentTeam.name : '') || 
                    player.player_api_lookup || '';
                  
                  // Determine source for visual indicator
                  const source = player.source || 'Unknown';
                  const sourceClass = source === 'MLB API' ? 'source-mlb' : 'source-db';
                  
                  return (
                    <div 
                      key={`search-result-${player.id || player.player_id || index}`} 
                      className={`search-result-item ${sourceClass} ${drafted ? 'already-drafted' : ''}`}
                      onClick={() => handleSelectPlayer(player)}
                    >
                      <div className="player-name">
                        {playerName} 
                        {drafted && <span className="drafted-indicator" style={{color: 'red'}}> (ALREADY DRAFTED)</span>}
                      </div>
                      <div className="player-details">
                        <span className="player-position">{position}</span>
                        {teamName && <span className="player-team"> | {teamName}</span>}
                        <span className="player-source"> ({source})</span>
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
                   {isPlayerDrafted(selectedPlayer) && <span className="drafted-indicator" style={{color: 'red'}}> (ALREADY DRAFTED)</span>}
                </div>
                <div className="player-details">
                  <div>Position: {selectedPlayer.position || 
                    (selectedPlayer.primaryPosition ? selectedPlayer.primaryPosition.abbreviation : 'Unknown')}</div>
                  <div>Team: {selectedPlayer.mlbTeam || 
                    (selectedPlayer.currentTeam ? selectedPlayer.currentTeam.name : '') || 
                    selectedPlayer.player_api_lookup || 'Unknown'}</div>
                  <div>Source: {selectedPlayer.source || 'Unknown'}</div>
                  {selectedPlayer.bats && <div>Bats: {selectedPlayer.bats}</div>}
                  {selectedPlayer.throws && <div>Throws: {selectedPlayer.throws}</div>}
                  {selectedPlayer.id && <div>Player ID: {selectedPlayer.id || selectedPlayer.player_id}</div>}
                </div>

                <div className="player-eligibility" style={{ marginTop: '0.5rem' }}>
                  <div className="info-label">Eligible Positions:</div>
                  <div className="info-value">
                    {getPlayerEligiblePositions(selectedPlayer).join(', ') || 'None'}
                  </div>
                </div>
                
                {!isPlayerDrafted(selectedPlayer) ? (
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label htmlFor="roster-slot-select">Select Roster Slot:</label>
                    <select 
                      id="roster-slot-select"
                      value={selectedRosterSlot}
                      onChange={(e) => setSelectedRosterSlot(e.target.value)}
                      className="roster-slot-select"
                    >
                      <option value="">-- Select Roster Slot --</option>
                      {renderRosterSlotOptions()}
                    </select>
                  </div>
                ) : (
                  <div className="already-drafted-warning" style={{ marginTop: '1rem', color: 'red' }}>
                    This player has already been drafted and cannot be selected again.
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button 
            className="make-pick-button"
            onClick={handleMakePick}
            disabled={
              !selectedTeam || 
              !selectedPlayer || 
              !selectedRosterSlot || 
              isPlayerDrafted(selectedPlayer)
            }
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