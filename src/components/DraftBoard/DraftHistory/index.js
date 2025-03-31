import React, { useState } from 'react';
import './DraftHistory.css';
import DraftRoundTree from './DraftRoundTree';
import DraftTeamTree from './DraftTeamTree';

const DraftHistory = ({ draftPicks, teams, displayMode }) => {
  const totalRounds = 25; // Example: 25 rounds in the draft
  
  // Early return if teams aren't loaded yet
  if (!teams || teams.length === 0) {
    return <div>Loading teams...</div>;
  }
  
  // Group draft picks by team
  const picksByTeam = {};
  teams.forEach(team => {
    picksByTeam[team.team_id] = [];
  });
  
  // Group draft picks by round
  const picksByRound = {};
  for (let i = 1; i <= totalRounds; i++) {
    picksByRound[i] = [];
  }
  
  // Process picks
  // Assign pick numbers if they don't exist
  let pickCounter = 1;
  const processedPicks = draftPicks.map(pick => {
    // If pick doesn't have a pick_number, assign one based on order
    if (!pick.pick_number) {
      pick.pick_number = pickCounter++;
    }
    
    // If pick has team_name but not team_id, look it up
    if (pick.team_name && !pick.team_id) {
      const matchingTeam = teams.find(team => 
        team.team_name === pick.team_name || 
        team.team_name.toLowerCase() === pick.team_name.toLowerCase()
      );
      if (matchingTeam) {
        pick.team_id = matchingTeam.team_id;
        console.log(`Mapped team name ${pick.team_name} to team_id ${pick.team_id}`);
      }
    }
    
    return pick;
  });

  // Process each pick
  processedPicks.forEach(pick => {
    // Add to team grouping - try both team_id and team_name
    if (pick.team_id) {
      if (!picksByTeam[pick.team_id]) {
        picksByTeam[pick.team_id] = [];
      }
      picksByTeam[pick.team_id].push(pick);
    } else if (pick.team_name) {
      // Try to find matching team by name
      const matchingTeam = teams.find(team => 
        team.team_name === pick.team_name || 
        team.team_name.toLowerCase() === pick.team_name.toLowerCase()
      );
      
      if (matchingTeam) {
        if (!picksByTeam[matchingTeam.team_id]) {
          picksByTeam[matchingTeam.team_id] = [];
        }
        picksByTeam[matchingTeam.team_id].push(pick);
      } else {
        console.warn(`Could not find team ID for team name: ${pick.team_name}`);
      }
    }
    
    // Add to round grouping
    const pickNumber = pick.pick_number;
    const roundNumber = Math.ceil(pickNumber / teams.length);
    if (!picksByRound[roundNumber]) {
      picksByRound[roundNumber] = [];
    }
    picksByRound[roundNumber].push(pick);
  });
  
  console.log("Processed picks:", processedPicks);
  console.log("Picks by team:", picksByTeam);
  console.log("Picks by round:", picksByRound);
  
  return (
    <div className="draft-history">
      <h2>Draft Board</h2>
      
      {displayMode === 'round' ? (
        <DraftRoundTree 
          picksByRound={picksByRound}
          teams={teams}
          totalRounds={totalRounds}
        />
      ) : (
        <DraftTeamTree
          picksByTeam={picksByTeam}
          draftPicks={draftPicks}
          teams={teams}
        />
      )}
    </div>
  );
};

export default DraftHistory;