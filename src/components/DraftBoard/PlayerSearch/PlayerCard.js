import React from 'react';

const PlayerCard = ({ player, isPlayerDrafted }) => {
  // Helper function to get player's eligible positions
  const getPlayerEligiblePositions = () => {
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

  return (
    <div className="selected-player">
      <h3>Selected Player:</h3>
      <div className="player-card">
        <div className="player-name">
          {player.fullName || player.name || 
           `${player.player_first_name || ''} ${player.player_last_name || ''}`.trim() ||
           'Unknown Player'}
           {isPlayerDrafted(player) && <span className="drafted-indicator" style={{color: 'red'}}> (ALREADY DRAFTED)</span>}
        </div>
        <div className="player-details">
          <div>Position: {player.position || 
            (player.primaryPosition ? player.primaryPosition.abbreviation : 'Unknown')}</div>
          <div>Team: {player.mlbTeam || 
            (player.currentTeam ? player.currentTeam.name : '') || 
            player.player_api_lookup || 'Unknown'}</div>
          <div>Source: {player.source || 'Unknown'}</div>
          {player.bats && <div>Bats: {player.bats}</div>}
          {player.throws && <div>Throws: {player.throws}</div>}
          {player.id && <div>Player ID: {player.id || player.player_id}</div>}
        </div>

        <div className="player-eligibility" style={{ marginTop: '0.5rem' }}>
          <div className="info-label">Eligible Positions:</div>
          <div className="info-value">
            {getPlayerEligiblePositions().join(', ') || 'None'}
          </div>
        </div>
        
        {isPlayerDrafted(player) && (
          <div className="already-drafted-warning" style={{ marginTop: '1rem', color: 'red' }}>
            This player has already been drafted and cannot be selected again.
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;