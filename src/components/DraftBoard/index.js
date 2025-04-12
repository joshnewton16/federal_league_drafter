import React, { useState, useEffect } from 'react';
import { getDraftResults, getTeams, getCurrentYear } from '../../api/api-client';
import './board.css';

// Inline styles for more direct control
const styles = {
  contentLayout: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    alignItems: 'flex-start',
  },
  selectionPanel: {
    width: '600px',
    minWidth: '600px',
    maxWidth: '600px',
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    alignSelf: 'flex-start',
    position: 'sticky',
    top: '20px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
  },
  historyPanel: {
    flex: 1,
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    overflow: 'auto',
  }
};

// Import our component files
import TeamSelector from './TeamSelector';
import PlayerSearch from './PlayerSearch';
import RosterSlotSelector from './RosterSlotSelector';
import DraftControls from './DraftControls';
import DraftHistory from './DraftHistory';
import { LoadingSpinner } from '../common';

const DraftBoard = () => {
  // Core state declarations
  const [draftPicks, setDraftPicks] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedRosterSlot, setSelectedRosterSlot] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [currentYear, setCurrentYear] = useState(null);
  const [draftedPlayers, setDraftedPlayers] = useState(new Set());
  const [filledRosterSlots, setFilledRosterSlots] = useState({});
  const [displayMode, setDisplayMode] = useState('round'); // 'round' or 'team'

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
        const picks = await getDraftResults();
        console.log("Received draft picks:", picks);
        setDraftPicks(picks);
        
        // Process existing picks
        processExistingPicks(picks, teamsData);
        
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

  // Process existing picks to track drafted players and filled roster slots
  const processExistingPicks = (picks, teamsList) => {
    console.log("Processing picks:", picks);
    console.log("Team list:", teamsList);
    
    // Create set of already drafted players
    const draftedPlayerIds = new Set();
    
    // Create object to track filled roster slots by team
    const filledSlots = {};
    
    // Initialize filled slots object for each team
    teamsList.forEach(team => {
      filledSlots[team.team_id] = new Set();
    });
    
    // Process each draft pick
    picks.forEach(pick => {
      console.log("Processing pick:", pick);
      
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
      } else if (pick.team_name && pick.roster_position) {
        // Try to match team by name
        const matchingTeam = teamsList.find(team => 
          team.team_name === pick.team_name || 
          team.team_name.toLowerCase() === pick.team_name.toLowerCase()
        );
        
        if (matchingTeam) {
          if (!filledSlots[matchingTeam.team_id]) {
            filledSlots[matchingTeam.team_id] = new Set();
          }
          filledSlots[matchingTeam.team_id].add(pick.roster_position);
        }
      }
    });
    
    // Update state
    setDraftedPlayers(draftedPlayerIds);
    setFilledRosterSlots(filledSlots);
    
    console.log("Drafted players:", draftedPlayerIds);
    console.log("Filled roster slots:", filledSlots);
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

  // Function to check if player is already drafted
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

  // Handle successful draft pick
  const handleDraftSuccess = async (updatedPicks) => {
    // Refresh draft picks
    setDraftPicks(updatedPicks);
    
    // Update drafted players and filled roster slots
    processExistingPicks(updatedPicks, teams);
    
    // Reset selections
    setSelectedPlayer(null);
    setSelectedRosterSlot('');
    
    // Auto-select the next team on the clock
    determineTeamOnClock(teams, updatedPicks);
  };

  // Render loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading draft board..." />;
  }

  // Toggle display mode
  const handleDisplayModeChange = (mode) => {
    setDisplayMode(mode);
  };

  // Render component with new layout
  return (
    <div className="draft-board-container">
      <div className="draft-header">
        <h2>Federal League Draft Board {currentYear?.year_name}</h2>
        {currentYear && <div className="year-info">Year ID: {currentYear.year_id}</div>}
      </div>
      
      <div style={styles.contentLayout}>
        {/* Make Selection Panel - Now with inline styles for width */}
        <div style={styles.selectionPanel}>
          <h3>Make Selection</h3>
          <div className="selection-form">
            <TeamSelector 
              teams={teams}
              selectedTeam={selectedTeam}
              onTeamSelect={setSelectedTeam}
            />
            
            <PlayerSearch 
              selectedTeam={selectedTeam}
              onPlayerSelect={setSelectedPlayer}
              selectedPlayer={selectedPlayer}
              isPlayerDrafted={isPlayerDrafted}
            />
            
            {selectedPlayer && (
              <RosterSlotSelector
                selectedTeam={selectedTeam}
                selectedPlayer={selectedPlayer}
                filledRosterSlots={filledRosterSlots}
                selectedRosterSlot={selectedRosterSlot}
                onRosterSlotSelect={setSelectedRosterSlot}
                isPlayerDrafted={isPlayerDrafted}
              />
            )}
            
            <DraftControls
              selectedTeam={selectedTeam}
              selectedPlayer={selectedPlayer}
              selectedRosterSlot={selectedRosterSlot}
              teams={teams}
              isPlayerDrafted={isPlayerDrafted}
              onDraftSuccess={handleDraftSuccess}
            />
          </div>
        </div>
        
        {/* Draft History Panel - Using inline styles */}
        <div style={styles.historyPanel}>
          <div className="display-mode-toggle">
            <button 
              className={`display-mode-button ${displayMode === 'round' ? 'active' : ''}`}
              onClick={() => handleDisplayModeChange('round')}
            >
              Display by Round
            </button>
            <button 
              className={`display-mode-button ${displayMode === 'team' ? 'active' : ''}`}
              onClick={() => handleDisplayModeChange('team')}
            >
              Display by Team
            </button>
          </div>
          
          <DraftHistory 
            draftPicks={draftPicks}
            teams={teams}
            displayMode={displayMode}
          />
        </div>
      </div>
    </div>
  );
};

export default DraftBoard;