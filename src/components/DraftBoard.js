import React, { useState, useEffect } from 'react';
import { getDraftPicks, addDraftPick } from '../api/database';
import { searchPlayersByName } from '../api/mlb';

const DraftBoard = ({ teams }) => {
  const [draftPicks, setDraftPicks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load draft picks on component mount
    const loadDraftPicks = async () => {
      try {
        const picks = await getDraftPicks();
        setDraftPicks(picks);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading draft picks:', error);
        setIsLoading(false);
      }
    };

    loadDraftPicks();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const players = await searchPlayersByName(searchTerm);
      setSearchResults(players);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleMakePick = async () => {
    if (!selectedTeam || !selectedPlayer) return;
    
    try {
      // Adapt to our database schema
      const pickData = {
        team_id: selectedTeam,
        player_id: selectedPlayer.id || selectedPlayer.player_id,
        year_id: new Date().getFullYear(), // Current year
        roster_id: draftPicks.length + 1, // Use this as a pick number/position
      };
      
      await addDraftPick(pickData);
      
      // Add fields for UI display that aren't in the database
      const displayData = {
        ...pickData,
        playerName: selectedPlayer.fullName || selectedPlayer.name || `${selectedPlayer.player_first_name} ${selectedPlayer.player_last_name}`,
        position: selectedPlayer.position,
        mlbTeam: selectedPlayer.mlbTeamName || selectedPlayer.mlbTeam || selectedPlayer.player_api_lookup,
        pickNumber: draftPicks.length + 1,
      };
      
      // Update local state
      setDraftPicks([...draftPicks, displayData]);
      setSelectedPlayer(null);
      setSelectedTeam('');
    } catch (error) {
      console.error('Error making draft pick:', error);
    }
  };

  const renderDraftOrder = () => {
    const totalRounds = 25; // Example: 25 rounds in the draft
    const rounds = [];
    
    for (let round = 1; round <= totalRounds; round++) {
      const roundPicks = [];
      
      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const pickNumber = (round - 1) * teams.length + i + 1;
        const pick = draftPicks.find(p => p.pickNumber === pickNumber);
        
        roundPicks.push(
          <div key={pickNumber} className="draft-pick">
            <div className="pick-number">{pickNumber}</div>
            <div className="team-name">{team.name}</div>
            {pick ? (
              <div className="player-selected">
                <div className="player-name">{pick.playerName}</div>
                <div className="player-details">
                  {pick.position} | {pick.mlbTeam}
                </div>
              </div>
            ) : (
              <div className="pick-empty">On the clock</div>
            )}
          </div>
        );
      }
      
      rounds.push(
        <div key={round} className="draft-round">
          <h3>Round {round}</h3>
          <div className="round-picks">{roundPicks}</div>
        </div>
      );
    }
    
    return rounds;
  };

  if (isLoading) {
    return <div className="loading">Loading draft board...</div>;
  }

  return (
    <div className="draft-board-container">
      <div className="draft-controls">
        <h2>Make Selection</h2>
        <div className="selection-form">
          <div className="form-group">
            <label htmlFor="team-select">Select Team:</label>
            <select 
              id="team-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">-- Select Team --</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="player-search">Search Player:</label>
            <div className="search-container">
              <input 
                id="player-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter player name"
              />
              <button 
                className="search-button"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(player => (
                  <div 
                    key={player.id} 
                    className="search-result-item"
                    onClick={() => handleSelectPlayer(player)}
                  >
                    <div className="player-name">{player.fullName}</div>
                    <div className="player-details">
                      {player.position} | {player.mlbTeamName || 'Free Agent'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedPlayer && (
            <div className="selected-player">
              <h3>Selected Player:</h3>
              <div className="player-card">
                <div className="player-name">{selectedPlayer.fullName}</div>
                <div className="player-details">
                  <div>Position: {selectedPlayer.position}</div>
                  <div>Team: {selectedPlayer.mlbTeamName || 'Free Agent'}</div>
                  <div>Bats: {selectedPlayer.bats} | Throws: {selectedPlayer.throws}</div>
                </div>
              </div>
            </div>
          )}
          
          <button 
            className="make-pick-button"
            onClick={handleMakePick}
            disabled={!selectedTeam || !selectedPlayer}
          >
            Make Selection
          </button>
        </div>
      </div>
      
      <div className="draft-board">
        <h2>Draft Board</h2>
        {renderDraftOrder()}
      </div>
    </div>
  );
};

export default DraftBoard;