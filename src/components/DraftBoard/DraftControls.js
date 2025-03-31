import React from 'react';
import { addDraftPick, getDraftPicks } from '../../api/database';

const DraftControls = ({ 
  selectedTeam, 
  selectedPlayer, 
  selectedRosterSlot, 
  teams,
  isPlayerDrafted,
  onDraftSuccess
}) => {
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
      
      // Call the success handler with updated picks
      onDraftSuccess(updatedPicks);
      
      // Success message is now logged to console instead of showing an alert
      console.log(`Player drafted: ${result.message || 'Success!'}`);
    } catch (error) {
      console.error('Error making draft pick:', error);
      alert(`Error drafting player: ${error.message || 'Please try again.'}`);
    }
  };

  return (
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
  );
};

export default DraftControls;