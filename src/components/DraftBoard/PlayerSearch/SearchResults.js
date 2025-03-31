import React from 'react';

const SearchResults = ({ searchResults, isPlayerDrafted, onSelectPlayer }) => {
  return (
    <div className="search-results">
      <h4>Search Results ({searchResults.length})</h4>
      {searchResults.map((player, index) => {
        // Check if player is already drafted
        const drafted = isPlayerDrafted(player);
        
        // Get player name from the available fields
        const playerName = player.fullName || player.name || 
          `${player.player_first_name || ''} ${player.player_last_name || ''}`.trim();
        
        // Get player position
        const position = player.position || 
          (player.primaryPosition ? player.primaryPosition.abbreviation : '');
        
        // Get player team 
        const teamName = player.mlbTeam || 
          (player.currentTeam ? player.currentTeam.name : '') || 
          player.player_api_lookup || '';
        
        // Determine source for visual indicator
        const source = player.source || 'Unknown';
        const sourceClass = source === 'MLB API' ? 'source-mlb' : 'source-db';
        
        return (
          <div 
            key={`search-result-${player.id || player.player_id || index}`} 
            className={`search-result-item ${sourceClass} ${drafted ? 'already-drafted' : ''}`}
            onClick={() => onSelectPlayer(player)}
          >
            <div className="player-name">
              {playerName} 
              {drafted && <span className="drafted-indicator" style={{color: 'red'}}> (ALREADY DRAFTED)</span>}
            </div>
            <div className="player-details">
              <span className="player-position">{position}</span>
              {teamName && <span className="player-team"> | {teamName}</span>}
              <span className="player-source"> ({source})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SearchResults;