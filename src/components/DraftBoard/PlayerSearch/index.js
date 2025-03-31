import React, { useState, useEffect } from 'react';
import { searchPlayersByName, getMlbTeams, searchMinorLeaguePlayers } from '../../../api/mlb';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import PlayerCard from './PlayerCard';

const PlayerSearch = ({ selectedTeam, onPlayerSelect, selectedPlayer, isPlayerDrafted }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState('mlb'); // 'mlb' or 'milb'
  const [mlbTeams, setMlbTeams] = useState([]);
  const [selectedMlbTeam, setSelectedMlbTeam] = useState('');
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Load MLB teams when in milb search mode
  useEffect(() => {
    if (searchMode === 'milb') {
      const loadMlbTeams = async () => {
        setIsLoadingTeams(true);
        try {
          const teams = await getMlbTeams();
          const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
          setMlbTeams(teams);
        } catch (error) {
          console.error('Error loading MLB teams:', error);
        } finally {
          setIsLoadingTeams(false);
        }
      };
      
      loadMlbTeams();
    }
  }, [searchMode]);

  // Handle player search
  const handleSearch = async () => {
    if (searchMode === 'milb' && !selectedMlbTeam) {
      alert('Please select an MLB team to search their minor league players');
      return;
    }
    
    if (searchMode === 'mlb' && !searchTerm.trim()) {
      return;
    }
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      let players = [];
      
      if (searchMode === 'mlb') {
        // Use existing search logic for MLB players
        players = await searchPlayersByName(searchTerm);
      } else {
        // Search minor league players by MLB parent team
        players = await searchMinorLeaguePlayers(selectedMlbTeam);
        
        // Optionally filter by name if searchTerm is provided
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          players = players.filter(player => 
            player.fullName.toLowerCase().includes(term)
          );
        }
      }
      
      if (players && players.length > 0) {
        // Filter out MLB players if database players are available (only in MLB mode)
        if (searchMode === 'mlb') {
          const dbPlayers = players.filter(player => player.source === 'Database');
          
          if (dbPlayers.length > 0) {
            console.log('Found players in database - using only database results');
            setSearchResults(dbPlayers);
          } else {
            console.log('No database players found - using MLB API results');
            setSearchResults(players);
          }
        } else {
          // In MiLB mode, show all results
          setSearchResults(players);
        }
      } else {
        console.log('No players found for search criteria');
      }
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handler for player selection from search results
  const handleSelectPlayer = (player) => {
    onPlayerSelect(player);
    setSearchResults([]);
    setSearchTerm('');
  };

  return (
    <div className="form-group">
      <label htmlFor="player-search">Search Player:</label>
      
      <SearchForm 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        handleSearch={handleSearch}
        isSearching={isSearching}
        mlbTeams={mlbTeams}
        selectedMlbTeam={selectedMlbTeam}
        setSelectedMlbTeam={setSelectedMlbTeam}
        isLoadingTeams={isLoadingTeams}
      />
      
      {searchResults.length > 0 && (
        <SearchResults 
          searchResults={searchResults}
          isPlayerDrafted={isPlayerDrafted}
          onSelectPlayer={handleSelectPlayer}
        />
      )}
      
      {isSearching && <div className="searching-message">Searching...</div>}
      
      {!isSearching && searchTerm && searchResults.length === 0 && (
        <div className="no-results">No players found matching "{searchTerm}"</div>
      )}
      
      {selectedPlayer && (
        <PlayerCard 
          player={selectedPlayer}
          isPlayerDrafted={isPlayerDrafted}
        />
      )}
    </div>
  );
};

export default PlayerSearch;