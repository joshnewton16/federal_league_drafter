import React, { useState } from 'react';
import { searchPlayersByName, getPlayerStats } from '../api/mlb';
import { searchPlayers } from '../api/database';

const PlayerSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('mlb'); // 'mlb' or 'database'
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [filters, setFilters] = useState({
    position: '',
    team: '',
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSelectedPlayer(null);
    setPlayerStats(null);
    
    try {
      let results;
      
      if (searchLocation === 'mlb') {
        results = await searchPlayersByName(searchTerm);
      } else {
        results = await searchPlayers(searchTerm);
      }
      
      // Apply filters if any
      if (filters.position) {
        results = results.filter(player => 
          player.position === filters.position || 
          player.positionName === filters.position
        );
      }
      
      if (filters.team) {
        results = results.filter(player => 
          player.mlbTeamName === filters.team || 
          player.mlbTeam === filters.team
        );
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlayer = async (player) => {
    setSelectedPlayer(player);
    
    // Fetch player stats if they're from MLB API
    if (searchLocation === 'mlb' && player.id) {
      try {
        // Get both hitting and pitching stats
        const hittingStats = await getPlayerStats(player.id, 'hitting');
        const pitchingStats = await getPlayerStats(player.id, 'pitching');
        
        setPlayerStats({
          hitting: hittingStats,
          pitching: pitchingStats
        });
      } catch (error) {
        console.error('Error fetching player stats:', error);
      }
    }
  };

  const renderStats = () => {
    if (!playerStats) return null;
    
    // Determine if player is primarily a hitter or pitcher
    const isPitcher = selectedPlayer?.position === 'P';
    
    if (isPitcher && playerStats.pitching.length > 0) {
      const stats = playerStats.pitching[0].stat;
      return (
        <div className="player-stats">
          <h3>Pitching Stats</h3>
          <table>
            <thead>
              <tr>
                <th>W</th>
                <th>L</th>
                <th>ERA</th>
                <th>G</th>
                <th>GS</th>
                <th>SV</th>
                <th>IP</th>
                <th>SO</th>
                <th>BB</th>
                <th>WHIP</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{stats.wins}</td>
                <td>{stats.losses}</td>
                <td>{stats.era?.toFixed(2) || '-'}</td>
                <td>{stats.gamesPlayed}</td>
                <td>{stats.gamesStarted}</td>
                <td>{stats.saves}</td>
                <td>{stats.inningsPitched}</td>
                <td>{stats.strikeOuts}</td>
                <td>{stats.baseOnBalls}</td>
                <td>{stats.whip?.toFixed(2) || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    } else if (playerStats.hitting.length > 0) {
      const stats = playerStats.hitting[0].stat;
      return (
        <div className="player-stats">
          <h3>Hitting Stats</h3>
          <table>
            <thead>
              <tr>
                <th>AVG</th>
                <th>HR</th>
                <th>RBI</th>
                <th>R</th>
                <th>SB</th>
                <th>OBP</th>
                <th>SLG</th>
                <th>OPS</th>
                <th>AB</th>
                <th>H</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{stats.avg?.toFixed(3) || '.000'}</td>
                <td>{stats.homeRuns || 0}</td>
                <td>{stats.rbi || 0}</td>
                <td>{stats.runs || 0}</td>
                <td>{stats.stolenBases || 0}</td>
                <td>{stats.obp?.toFixed(3) || '.000'}</td>
                <td>{stats.slg?.toFixed(3) || '.000'}</td>
                <td>{stats.ops?.toFixed(3) || '.000'}</td>
                <td>{stats.atBats || 0}</td>
                <td>{stats.hits || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    } else {
      return <div className="no-stats">No stats available for this player</div>;
    }
  };

  return (
    <div className="player-search-container">
      <h2>Player Search</h2>
      
      <div className="search-controls">
        <div className="search-source">
          <label>
            <input 
              type="radio" 
              name="searchLocation" 
              value="mlb" 
              checked={searchLocation === 'mlb'}
              onChange={() => setSearchLocation('mlb')}
            />
            Search MLB API
          </label>
          <label>
            <input 
              type="radio" 
              name="searchLocation" 
              value="database" 
              checked={searchLocation === 'database'}
              onChange={() => setSearchLocation('database')}
            />
            Search Local Database
          </label>
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="position-filter">Position:</label>
            <select 
              id="position-filter"
              value={filters.position}
              onChange={(e) => setFilters({...filters, position: e.target.value})}
            >
              <option value="">All Positions</option>
              <option value="P">Pitcher</option>
              <option value="C">Catcher</option>
              <option value="1B">First Base</option>
              <option value="2B">Second Base</option>
              <option value="3B">Third Base</option>
              <option value="SS">Shortstop</option>
              <option value="OF">Outfield</option>
              <option value="DH">Designated Hitter</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="team-filter">Team:</label>
            <input 
              id="team-filter"
              type="text"
              placeholder="Team name"
              value={filters.team}
              onChange={(e) => setFilters({...filters, team: e.target.value})}
            />
          </div>
        </div>
        
        <div className="search-box">
          <input 
            type="text"
            placeholder="Search for a player..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      <div className="search-results-container">
        <div className="results-list">
          <h3>Results ({searchResults.length})</h3>
          {searchResults.length === 0 ? (
            <div className="no-results">
              {isSearching ? 'Searching...' : 'No results found'}
            </div>
          ) : (
            <div className="results-grid">
              {searchResults.map(player => (
                <div 
                  key={player.id} 
                  className={`player-result ${selectedPlayer?.id === player.id ? 'selected' : ''}`}
                  onClick={() => handleSelectPlayer(player)}
                >
                  <div className="player-name">{player.fullName || player.name}</div>
                  <div className="player-position">{player.position}</div>
                  <div className="player-team">{player.mlbTeamName || player.mlbTeam || 'Free Agent'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {selectedPlayer && (
          <div className="player-details-panel">
            <h3>Player Details</h3>
            <div className="player-card">
              <div className="player-header">
                <div className="player-name">{selectedPlayer.fullName || selectedPlayer.name}</div>
                <div className="player-number">
                  {selectedPlayer.number ? `#${selectedPlayer.number}` : ''}
                </div>
              </div>
              
              <div className="player-info">
                <div className="info-group">
                  <div className="info-label">Position:</div>
                  <div className="info-value">
                    {selectedPlayer.positionName || selectedPlayer.position}
                  </div>
                </div>
                
                <div className="info-group">
                  <div className="info-label">Team:</div>
                  <div className="info-value">
                    {selectedPlayer.mlbTeamName || selectedPlayer.mlbTeam || 'Free Agent'}
                  </div>
                </div>
                
                {selectedPlayer.bats && (
                  <div className="info-group">
                    <div className="info-label">Bats:</div>
                    <div className="info-value">{selectedPlayer.bats}</div>
                  </div>
                )}
                
                {selectedPlayer.throws && (
                  <div className="info-group">
                    <div className="info-label">Throws:</div>
                    <div className="info-value">{selectedPlayer.throws}</div>
                  </div>
                )}
                
                {selectedPlayer.birthDate && (
                  <div className="info-group">
                    <div className="info-label">Birth Date:</div>
                    <div className="info-value">{selectedPlayer.birthDate}</div>
                  </div>
                )}
              </div>
              
              {renderStats()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSearch;