import React, { useState } from 'react';

const DraftRoundTree = ({ picksByRound, teams, totalRounds }) => {
  // Track expanded rounds
  const [expandedRounds, setExpandedRounds] = useState(new Set([1])); // Start with Round 1 expanded
  
  // Toggle round expansion
  const toggleRoundExpansion = (roundNumber) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundNumber)) {
      newExpanded.delete(roundNumber);
    } else {
      newExpanded.add(roundNumber);
    }
    setExpandedRounds(newExpanded);
  };
  
  // Count existing picks
  const picksCount = Object.values(picksByRound).reduce(
    (total, picks) => total + picks.length, 0
  );
  
  // Determine which team is on the clock
  const calculateTeamOnClock = () => {
    const nextPickNumber = picksCount + 1;
    const roundNumber = Math.ceil(nextPickNumber / teams.length);
    const positionInRound = (nextPickNumber - 1) % teams.length;
    
    let teamIndex;
    if (roundNumber % 2 === 1) {
      // Odd rounds go in ascending order by team_id
      teamIndex = positionInRound;
    } else {
      // Even rounds go in descending order by team_id
      teamIndex = teams.length - 1 - positionInRound;
    }
    
    // Sort teams by team_id
    const sortedTeams = [...teams].sort((a, b) => a.team_id - b.team_id);
    return sortedTeams[teamIndex]?.team_id;
  };
  
  const teamOnClock = calculateTeamOnClock();
  
  return (
    <div className="draft-round-tree">
      {Array.from({ length: totalRounds }, (_, i) => {
        const roundNumber = i + 1;
        const isExpanded = expandedRounds.has(roundNumber);
        const roundPicks = picksByRound[roundNumber] || [];
        
        // Count completed picks in this round
        const completedPicksInRound = roundPicks.length;
        const totalPicksInRound = teams.length;
        const isCurrentRound = Math.ceil((picksCount + 1) / teams.length) === roundNumber;
        
        return (
          <div key={`round-tree-${roundNumber}`} 
               className={`draft-tree-item ${roundNumber % 2 === 0 ? 'round-even' : 'round-odd'}`}>
            <div className="tree-header" onClick={() => toggleRoundExpansion(roundNumber)}>
              <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
              <h3>Round {roundNumber}</h3>
              <span className="pick-progress">
                {completedPicksInRound}/{totalPicksInRound} picks
                {isCurrentRound && ' (Current Round)'}
              </span>
            </div>
            
            <div className={`tree-content ${isExpanded ? 'expanded' : ''}`}>
              <ul className="pick-list">
                {teams.sort((a, b) => a.team_id - b.team_id).map((team, teamIndex) => {
                  // Calculate the pick number
                  let pickNumber;
                  if (roundNumber % 2 === 1) {
                    // Odd rounds: ascending order
                    pickNumber = (roundNumber - 1) * teams.length + teamIndex + 1;
                  } else {
                    // Even rounds: descending order (snake draft)
                    pickNumber = roundNumber * teams.length - teamIndex;
                  }
                  
                  // Find the pick for this position
                  // First try exact pick number match
                  let pick = roundPicks.find(p => p.pick_number === pickNumber);
                  
                  // If no match, fallback to finding by team in this round
                  if (!pick) {
                    pick = roundPicks.find(p => p.team_id === team.team_id);
                  }
                  
                  // Determine if this team is on the clock
                  const isOnTheClock = teamOnClock === team.team_id && 
                    pickNumber === picksCount + 1;
                  
                  return (
                    <li key={`pick-${pickNumber}`} 
                        className={`pick-item ${isOnTheClock ? 'on-the-clock' : ''}`}>
                      <span className="pick-number">{pickNumber}</span>
                      <span className="pick-team">{team.team_name}</span>
                      
                      {pick ? (
                        <div className="pick-player">
                          <span className="pick-player-name">
                            {pick.player_first_name && pick.player_last_name
                              ? `${pick.player_first_name} ${pick.player_last_name}`
                              : pick.player_name || 'Unknown Player'}
                          </span>
                          <span className="pick-player-position">
                            ({pick.roster_position || 'Unknown'})
                          </span>
                        </div>
                      ) : (
                        <div className="pick-empty">
                          {isOnTheClock ? 'On the Clock' : 'Not Selected'}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DraftRoundTree;