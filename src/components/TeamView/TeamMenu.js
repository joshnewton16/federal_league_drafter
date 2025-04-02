import React from 'react';
import './TeamMenu.css';

const TeamMenu = ({ teams, onSelectTeam, selectedTeam }) => {
  // Sort teams alphabetically by team_name
  const sortedTeams = [...teams].sort((a, b) => 
    a.team_name.localeCompare(b.team_name)
  );
  
  return (
    <div className="team-menu-container">
      <h3>Select a Team</h3>
      <div className="team-menu-list">
        {sortedTeams.map((team) => (
          <div 
            key={team.team_name}
            className={`team-menu-item ${selectedTeam && selectedTeam.team_name === team.team_name ? 'selected' : ''}`}
            onClick={() => onSelectTeam(team)}
          >
            {team.team_name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMenu;