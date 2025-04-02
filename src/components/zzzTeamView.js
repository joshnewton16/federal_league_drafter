import React, { useState, useEffect } from 'react';
import { getTeam, getTeamDraftPicks, updateTeam } from '../api/database';
import { getPlayerById } from '../api/database';

const TeamView = ({ teams }) => {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamDetails, setTeamDetails] = useState(null);
  const [teamRoster, setTeamRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    owner: '',
    email: ''
  });

  useEffect(() => {
    if (selectedTeamId) {
      loadTeamData(selectedTeamId);
    }
  }, [selectedTeamId]);

  const loadTeamData = async (teamId) => {
    setIsLoading(true);
    try {
      // Get team details
      const team = await getTeam(teamId);
      setTeamDetails(team);
      setEditForm({
        team_name: team.team_name,
        owner_id: team.owner_id
      });
      
      // Get team's draft picks
      const picks = await getTeamDraftPicks(teamId);
      
      setTeamRoster(picks);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTeam = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      team_name: teamDetails.team_name,
      owner_id: teamDetails.owner_id,
    });
  };

  const handleSaveTeam = async () => {
    try {
      await updateTeam(selectedTeamId, {
        team_name: editForm.team_name,
        owner_id: editForm.owner_id,
      });
      
      // Update local state
      setTeamDetails({
        ...teamDetails,
        team_name: editForm.team_name,
        owner_id: editForm.owner_id,
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value
    });
  };

  const groupPlayersByPosition = () => {
    const positions = {
      'C': [],
      '1B': [],
      '2B': [],
      '3B': [],
      'SS': [],
      'OF': [],
      'DH': [],
      'P': []
    };
    
    teamRoster.forEach(pick => {
      const position = pick.position || 'Unknown';
      if (positions[position]) {
        positions[position].push(pick);
      } else if (position.includes('OF')) {
        positions['OF'].push(pick);
      } else {
        if (!positions['Unknown']) positions['Unknown'] = [];
        positions['Unknown'].push(pick);
      }
    });
    
    return positions;
  };

  const renderTeamEdit = () => {
    return (
      <div className="team-edit-form">
        <h3>Edit Team</h3>
        <div className="form-group">
          <label htmlFor="team-name">Team Name:</label>
          <input 
            id="team-name"
            type="text"
            name="team_name"
            value={editForm.team_name}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="team-owner">Owner ID:</label>
          <input 
            id="team-owner"
            type="text"
            name="owner_id"
            value={editForm.owner_id}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-actions">
          <button className="save-button" onClick={handleSaveTeam}>Save Changes</button>
          <button className="cancel-button" onClick={handleCancelEdit}>Cancel</button>
        </div>
      </div>
    );
  };

  const renderTeamDetails = () => {
    if (!teamDetails) return null;
    
    return (
      <div className="team-info">
        <div className="team-header">
          <h3>{teamDetails.team_name}</h3>
          <button className="edit-button" onClick={handleEditTeam}>Edit Team</button>
        </div>
        
        <div className="team-meta">
          <div className="meta-item">
            <span className="meta-label">Owner:</span>
            <span className="meta-value">{teamDetails.owner_id}</span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">Draft Picks:</span>
            <span className="meta-value">{teamRoster.length}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderRoster = () => {
    if (teamRoster.length === 0) {
      return <div className="empty-roster">No players drafted yet</div>;
    }
    
    const positionGroups = groupPlayersByPosition();
    
    return (
      <div className="team-roster">
        <h3>Team Roster</h3>
        
        {Object.entries(positionGroups).map(([position, players]) => {
          if (players.length === 0) return null;
          
          return (
            <div key={position} className="position-group">
              <h4>{position}</h4>
              <div className="position-players">
                {players.map(pick => (
                  <div key={pick.id} className="roster-player">
                    <div className="player-name">{pick.playerName}</div>
                    <div className="player-details">
                      <span className="player-position">{pick.position}</span>
                      <span className="player-team">{pick.mlbTeam}</span>
                    </div>
                    <div className="pick-info">Pick #{pick.pickNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="team-view-container">
      <div className="team-selector">
        <h2>Team Viewer</h2>
        <select 
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
        >
          <option value="">-- Select Team --</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>
      
      {isLoading ? (
        <div className="loading">Loading team data...</div>
      ) : selectedTeamId ? (
        <div className="team-details">
          {isEditing ? renderTeamEdit() : renderTeamDetails()}
          {renderRoster()}
        </div>
      ) : (
        <div className="no-team-selected">Select a team to view details</div>
      )}
    </div>
  );
};

export default TeamView;