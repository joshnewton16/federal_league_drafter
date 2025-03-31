import React from 'react';

const DraftPick = ({ pick, team, pickNumber }) => {
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
    } else if (pick.player_api_lookup) {
      playerName = pick.player_api_lookup;
    } else {
      playerName = `Pick #${pickNumber}`;
    }
    
    playerPosition = pick.roster_position || pick.position || 'Unknown';
    playerTeam = pick.mlb_team || pick.player_api_lookup || '';
    
    // Debug the pick data
    console.log(`Rendering pick ${pickNumber} for team ${team.team_name}:`, pick);
  }
  
  return (
    <div className="draft-pick">
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
};

export default DraftPick;