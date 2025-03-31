import React from 'react';
import DraftPick from './DraftPick';

const DraftRound = ({ roundNumber, teams, picksByTeam }) => {
  return (
    <div className="draft-round">
      <h3>Round {roundNumber}</h3>
      <div className="round-picks">
        {teams.map((team, teamIndex) => {
          const pickNumber = (roundNumber - 1) * teams.length + teamIndex + 1;
          
          // Get the pick for this team and round
          const teamPicks = picksByTeam[team.team_id] || [];
          const pick = teamPicks[roundNumber - 1]; // 0-based index, round is 1-based
          
          return (
            <DraftPick 
              key={`pick-${team.team_id}-${roundNumber}`}
              pick={pick}
              team={team}
              pickNumber={pickNumber}
            />
          );
        })}
      </div>
    </div>
  );
};

export default DraftRound;