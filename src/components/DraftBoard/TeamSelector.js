import React from 'react';

const TeamSelector = ({ teams, selectedTeam, onTeamSelect }) => {
  return (
    <div className="form-group">
      <label htmlFor="team-select">Select Team:</label>
      <select 
        id="team-select"
        value={selectedTeam}
        onChange={(e) => onTeamSelect(e.target.value)}
      >
        <option value="">-- Select Team --</option>
        {teams && teams.map(team => (
          <option key={`team-${team.team_id}`} value={team.team_id}>
            {team.team_name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TeamSelector;