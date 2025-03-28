import React, { useState, useEffect } from 'react';
import DraftBoard from './DraftBoard';
import PlayerSearch from './PlayerSearch';
import TeamView from './TeamView';
import { getTeams } from '../api/database';

const App = () => {
  const [activeTab, setActiveTab] = useState('draft');
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        const teamsData = await getTeams();
        setTeams(teamsData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <div className="loading">Loading data...</div>;
    }

    switch (activeTab) {
      case 'draft':
        return <DraftBoard />;
      case 'search':
        return <PlayerSearch />;
      case 'teams':
        return <TeamView teams={teams} />;
      default:
        return <DraftBoard />;
    }
  };

  return (
    <div className="app">
      <header>
        <div className="container">
          <h1>Fantasy Baseball Draft Tool</h1>
          <nav>
            <button 
              className={`tab ${activeTab === 'draft' ? 'active' : ''}`}
              onClick={() => setActiveTab('draft')}
            >
              Draft Board
            </button>
            <button 
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Player Search
            </button>
            <button 
              className={`tab ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              Teams
            </button>
          </nav>
        </div>
      </header>
      <main className="container">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;