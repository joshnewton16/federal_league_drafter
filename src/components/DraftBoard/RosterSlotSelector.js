import React from 'react';
import { getTeamRoster } from '../../api/database';
import { useEffect } from 'react';

const RosterSlotSelector = ({ 
  selectedTeam, 
  selectedPlayer, 
  filledRosterSlots, 
  selectedRosterSlot, 
  onRosterSlotSelect,
  isPlayerDrafted
}) => {
  // Load team roster when team changes
  useEffect(() => {
    if (!selectedTeam) {
      return;
    }
    
    const loadTeamRoster = async () => {
      try {
        const roster = await getTeamRoster(selectedTeam);
        // You might want to pass this info up to the parent component
        // if you need to use it elsewhere
      } catch (error) {
        console.error('Error loading team roster:', error);
      }
    };
    
    loadTeamRoster();
  }, [selectedTeam]);

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

  // If player is already drafted, don't render the selector
  if (isPlayerDrafted(selectedPlayer)) {
    return null;
  }

  return (
    <div className="form-group" style={{ marginTop: '1rem' }}>
      <label htmlFor="roster-slot-select">Select Roster Slot:</label>
      <select 
        id="roster-slot-select"
        value={selectedRosterSlot}
        onChange={(e) => onRosterSlotSelect(e.target.value)}
        className="roster-slot-select"
      >
        <option value="">-- Select Roster Slot --</option>
        {renderRosterSlotOptions()}
      </select>
    </div>
  );
};

export default RosterSlotSelector;