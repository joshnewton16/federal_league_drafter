import React, { useState } from 'react';
import './TeamView.css';
import TeamDetail from '../TeamDetail';

const TeamView = ({ teams }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Sort teams alphabetically by team_name
  const sortedTeams = teams && teams.length 
    ? [...teams].sort((a, b) => a.team_name.localeCompare(b.team_name)) 
    : [];

  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
    // Here you would add logic to fetch additional team data if needed
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
                  key={team.team_name}
                  className={`team-list-item ${selectedTeam && selectedTeam.team_name === team.team_name ? 'selected' : ''}`}
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
              <p>This is where detailed team information will be displayed.</p>
              <p>For now, we're just showing the team name.</p>
              {/* You'll expand this with actual team details in the future */}
              <TeamDetail teamName={selectedTeam.team_name} />;
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