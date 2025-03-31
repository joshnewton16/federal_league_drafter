import React, { useState } from 'react';

const DraftTeamTree = ({ picksByTeam, draftPicks, teams }) => {
  // Track expanded teams
  const [expandedTeams, setExpandedTeams] = useState(new Set()); // Start with all collapsed
  
  // Toggle team expansion
  const toggleTeamExpansion = (teamId) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };
  
  return (
    <div className="draft-team-tree">
      {teams.sort((a, b) => a.team_name.localeCompare(b.team_name)).map(team => {
        const isExpanded = expandedTeams.has(team.team_id);
        
        // Get picks for this team - try direct match and name match
        let teamPicks = picksByTeam[team.team_id] || [];
        
        // Check if there are any picks for this team's name that aren't already in team's picks
        const nameMatchedPicks = draftPicks.filter(pick => 
          pick.team_name && 
          (pick.team_name === team.team_name || 
          pick.team_name.toLowerCase() === team.team_name.toLowerCase()) && 
          !teamPicks.some(tp => tp.pick_number === pick.pick_number)
        );
        
        if (nameMatchedPicks.length > 0) {
          console.log(`Found ${nameMatchedPicks.length} additional picks by team name for ${team.team_name}`);
          teamPicks = [...teamPicks, ...nameMatchedPicks];
        }
        
        if (teamPicks.length > 0) {
          console.log(`Team ${team.team_name} has ${teamPicks.length} picks`);
        }
        
        // Sort the team's picks by pick number if available, otherwise by default order
        const sortedPicks = [...teamPicks].sort((a, b) => {
          if (a.pick_number && b.pick_number) {
            return a.pick_number - b.pick_number;
          } else if (a.draft_id && b.draft_id) {
            return a.draft_id - b.draft_id;
          } else {
            return 0; // Keep original order if no sorting field available
          }
        });
        
        return (
          <div key={`team-tree-${team.team_id}`} className="draft-tree-item">
            <div className="tree-header" onClick={() => toggleTeamExpansion(team.team_id)}>
              <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
              <div className="team-header">
                <h3>{team.team_name}</h3>
              </div>
              <span className="pick-count">
                {teamPicks.length} picks
              </span>
            </div>
            
            <div className={`tree-content ${isExpanded ? 'expanded' : ''}`}>
              {sortedPicks.length > 0 ? (
                <ul className="pick-list">
                  {sortedPicks.map(pick => {
                    // Calculate the round number based on pick number
                    const roundNumber = pick.pick_number ? 
                      Math.ceil(pick.pick_number / teams.length) : 
                      Math.floor(sortedPicks.indexOf(pick) / teams.length) + 1;
                    
                    return (
                      <li key={`team-pick-${pick.pick_number}`} className="pick-item">
                        <span className="pick-number">#{pick.pick_number}</span>
                        <span className="pick-round">Round {roundNumber}</span>
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
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="no-picks">No picks made yet</div>
              )}
              
              {/* Show roster by position */}
              <div className="team-roster">
                <h4>Roster by Position</h4>
                <div className="roster-grid">
                  {(() => {
                    const positionGroups = {};
                    
                    // Initialize common position groups
                    ['P', 'C', '1B', '2B', '3B', 'SS', 'OF', 'U', 'Taxi'].forEach(pos => {
                      positionGroups[pos] = [];
                    });
                    
                    // Group the picks by position prefix
                    sortedPicks.forEach(pick => {
                      if (pick.roster_position) {
                        const posPrefix = pick.roster_position.split(' ')[0];
                        if (!positionGroups[posPrefix]) {
                          positionGroups[posPrefix] = [];
                        }
                        positionGroups[posPrefix].push(pick);
                      }
                    });
                    
                    // Render position groups
                    return Object.entries(positionGroups).map(([position, positionPicks]) => {
                      if (positionPicks.length === 0) return null;
                      
                      return (
                        <div key={`position-${position}`} className="position-group">
                          <h5>{position}</h5>
                          <ul className="position-list">
                            {positionPicks.map(pick => (
                              <li key={`pos-pick-${pick.pick_number}`} className="position-player">
                                <span className="player-name">
                                  {pick.player_first_name && pick.player_last_name
                                    ? `${pick.player_first_name} ${pick.player_last_name}`
                                    : pick.player_name || 'Unknown Player'}
                                </span>
                                <span className="player-slot">
                                  ({pick.roster_position})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DraftTeamTree;