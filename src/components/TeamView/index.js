import React, { useState } from 'react';
import './TeamView.css';
import TeamDetail from '../TeamDetail';

const TeamView = ({ teams }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  console.log('teams', teams);
  
  // Debug log to check if teams have team_id
  if (teams && teams.length > 0) {
    console.log('Sample team data:', teams[0]);
    console.log('Does team have team_id?', 'team_id' in teams[0]);
  }
  
  // Sort teams alphabetically by team_name
  const sortedTeams = teams && teams.length 
    ? [...teams].sort((a, b) => a.team_name.localeCompare(b.team_name)) 
    : [];

  const handleSelectTeam = (team) => {
    console.log('Selected team:', team);
    console.log('Selected team ID:', team.team_id);
    setSelectedTeam(team);
  };

  return (
    <div className="team-view-container">
      <h2>Team Information</h2>
      
      <div className="team-view-content">
        {/* Simple Team List */}
        <div className="team-list-container">
          <h3>Select a Team</h3>
          {sortedTeams.length > 0 ? (
            <div className="team-list">
              {sortedTeams.map((team) => (
                <div 
                  key={team.team_id || team.team_name} // Fallback to team_name if team_id doesn't exist
                  className={`team-list-item ${selectedTeam && selectedTeam.team_id === team.team_id ? 'selected' : ''}`}
                  onClick={() => handleSelectTeam(team)}
                >
                  {team.team_name}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-teams-message">
              No teams available
            </div>
          )}
        </div>
        
        {/* Team Details Area */}
        <div className="team-details-area">
          {selectedTeam ? (
            <div className="team-detail-content">
              <h3>{selectedTeam.team_name}</h3>
              <p>Team ID: {selectedTeam.team_id || 'undefined'}</p>
              <p>This is where detailed team information will be displayed.</p>
              {/* Fixed the semicolon after TeamDetail component */}
              <TeamDetail teamId={selectedTeam.team_id} />
            </div>
          ) : (
            <div className="team-select-prompt">
              <p>Select a team from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamView;