import React, { useState, useEffect } from 'react';
import DraftBoard from './DraftBoard';
import TeamView from './TeamView';
import LeaderBoard from './LeaderBoard';
import { getTeams } from '../api/api-client';

function AppComponent() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const styles = {
    tabContainer: {
      display: 'flex',
      gap: '10px'
    },
    tab: {
      padding: '10px 15px',
      backgroundColor: '#f0f0f0',
      color: '#333',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    activeTab: {
      backgroundColor: '#3c6e3b',
      color: 'white'
    }
  };

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        console.log("Fetching teams data...");
        const teamsData = await getTeams();
        console.log("Teams data received:", teamsData);
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

    console.log(`Rendering tab: ${activeTab}, teams count: ${teams.length}`);
    
    switch (activeTab) {
      case 'draft':
        return <DraftBoard />;
      case 'leaderboard':
        return <LeaderBoard />;
      case 'teams':
        // Make sure we're passing teams properly
        //console.log(teams);
        return <TeamView teams={teams} />;
      default:
        return <LeaderBoard />;
    }
  };

  return (
    <div className="app">
      <header>
        <div className="container">
          <nav>
            <button 
              style={{
                ...styles.tab, 
                ...(activeTab === 'leaderboard' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('leaderboard')}
            >
              League Leader Board
            </button>
            <button 
              style={{
                ...styles.tab, 
                ...(activeTab === 'teams' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('teams')}
            >
              Teams
            </button>
            <button 
              style={{
                ...styles.tab, 
                ...(activeTab === 'draft' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('draft')}
            >
              Draft Board
            </button>
          </nav>
        </div>
      </header>
      <main className="container">
        {renderContent()}
      </main>
    </div>
  );
}

export default AppComponent;