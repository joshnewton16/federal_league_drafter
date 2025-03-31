import React from 'react';

const SearchForm = ({ 
  searchTerm, 
  setSearchTerm, 
  searchMode, 
  setSearchMode, 
  handleSearch, 
  isSearching,
  mlbTeams,
  selectedMlbTeam,
  setSelectedMlbTeam,
  isLoadingTeams
}) => {
  return (
    <>
      <div className="search-mode-toggle">
        <div className="search-mode-option">
          <input
            type="radio"
            id="mlb-search"
            name="search-mode"
            value="mlb"
            checked={searchMode === 'mlb'}
            onChange={() => setSearchMode('mlb')}
          />
          <label htmlFor="mlb-search">MLB Players</label>
        </div>
        <div className="search-mode-option">
          <input
            type="radio"
            id="milb-search"
            name="search-mode"
            value="milb"
            checked={searchMode === 'milb'}
            onChange={() => setSearchMode('milb')}
          />
          <label htmlFor="milb-search">Minor League Players</label>
        </div>
      </div>

      {searchMode === 'milb' && (
        <div className="mlb-team-selector">
          <label htmlFor="mlb-team-select">Select MLB Team:</label>
          <select
            id="mlb-team-select"
            value={selectedMlbTeam}
            onChange={(e) => setSelectedMlbTeam(e.target.value)}
            disabled={isLoadingTeams}
          >
            <option value="">-- Select MLB Team --</option>
            {mlbTeams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          {isLoadingTeams && <span className="loading-indicator">Loading teams...</span>}
        </div>
      )}
      
      <div className="search-container">
        <input 
          id="player-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter player name"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          className="search-button"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
    </>
  );
};

export default SearchForm;