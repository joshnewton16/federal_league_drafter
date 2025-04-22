import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import './TeamDetail.css';

const TeamDetail = ({ teamId }) => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  console.log('teamId', teamId); // Fixed: lowercase 'd'
  
  useEffect(() => {
    // Replace with your actual API call
    const fetchTeamData = async () => {
      setLoading(true);
      try {
        // Example API endpoints
        console.log('starting try');
        const baseUrl = window.runtimeConfig && window.runtimeConfig.apiBaseUrl 
          ? window.runtimeConfig.apiBaseUrl 
          : '';
        
        console.log('Using API base URL:', baseUrl);
        const response = await fetch(`${baseUrl}/team-stats/${encodeURIComponent(teamId)}`); 
        const data = await response.json();
        setTeamData(data);
        console.log('teamData', data); // Fixed: logging data instead of teamData which would be null
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);
  
  if (loading) {
    return <div className="team-loading">Loading team data...</div>;
  }
  
  if (!teamData) {
    return <div className="team-error">Could not load team information</div>;
  }
  
  // Filter for players with roster_slot_id (Team Stats tab)
  const rosterHitters = teamData.rows.filter(player => 
    (player.roster_slot_id >= 2 && player.roster_slot_id <= 12)
  );

  const rosterPitchers = teamData.rows.filter(player => 
    (player.roster_slot_id >= 13 && player.roster_slot_id <= 19)
  );
  
  // Filter for hitters (players with AB > 0)
  const hitters = teamData.rows.filter(player => 
    parseInt(player.ab) > 0 || 
    (player.roster_slot_id >= 2 && player.roster_slot_id <= 12) // Position players
  );
  
  // Filter for pitchers (players with p_g > 0)
  const pitchers = teamData.rows.filter(player => 
    parseInt(player.p_g) > 0 || 
    (player.roster_slot_id >= 13 && player.roster_slot_id <= 19) // Pitchers
  );

  return (
    <div className="team-detail-container">
      <h2 className="team-id">{teamId}</h2>
      
      <div className="team-stats-summary">
        <div className="stat-card">
          <h3>Team Points</h3>
          <div className="stat-value">{teamData.totalPoints?.toFixed(1) || '0.0'}</div>
        </div>
        
        <div className="stat-card">
          <h3>League Rank</h3>
          <div className="stat-value">{teamData.leagueRank || 'N/A'}</div>
        </div>
      </div>
      
      <Tabs className="team-tabs">
        <TabList>
          <Tab>Team Stats</Tab>
          <Tab>Hitters</Tab>
          <Tab>Pitchers</Tab>
          <Tab>Yesterday's Stats</Tab>
        </TabList>
        
        <TabPanel>
        <div className="stats-table-container">
            <table className="stats-table team-stats">
              <thead className = "table-heading">
                <tr>
                  <th>Pos</th>
                  <th>Name</th>
                  <th>G</th>
                  <th>AB</th>
                  <th>R</th>
                  <th>H</th>
                  <th>BA</th>
                  <th>HR</th>
                  <th>RBI</th>
                  <th>SB</th>
                </tr>
              </thead>
              <tbody>
                {rosterHitters.map(player => {
                  const fullName = `${player.player_first_name} ${player.player_last_name}`;
                  
                  return (
                    <tr key={player.player_id}>
                      <td className="player-pos">{player.roster_slot_name}</td>
                      <td className="player-name">{fullName}</td>
                      <td>{player.g}</td>
                      <td>{player.ab}</td>
                      <td>{player.r}</td>
                      <td>{player.h}</td>
                      <td>{player.ba}</td>
                      <td>{player.hr}</td>
                      <td>{player.rbi}</td>
                      <td>{player.sb}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="stats-table-container">
            <table className="stats-table team-stats">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Name</th>
                  <th>G</th>
                  <th>IP</th>
                  <th>W</th>
                  <th>L</th>
                  <th>K</th>
                  <th>S</th>
                  <th>ERA</th>
                  <th>WHIP</th>
                  <th>W-L</th>
                </tr>
              </thead>
              <tbody>
                {rosterPitchers.map(player => {
                  const fullName = `${player.player_first_name} ${player.player_last_name}`;
                  
                  return (
                    <tr key={player.player_id}>
                      <td>{player.roster_slot_name}</td>
                      <td className="player-name">{fullName}</td>
                      <td>{player.p_g}</td>
                      <td>{player.ip}</td>
                      <td>{player.w}</td>
                      <td>{player.l}</td>
                      <td>{player.so}</td>
                      <td>{player.sv}</td>
                      <td>{player.era}</td>
                      <td>{player.whip}</td>
                      <td>{player.w-player.l}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="stats-table-container">
            <table className="stats-table hitter-stats">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Name</th>
                  <th>G</th>
                  <th>AB</th>
                  <th>R</th>
                  <th>H</th>
                  <th>BA</th>
                  <th>HR</th>
                  <th>RBI</th>
                  <th>SB</th>
                </tr>
              </thead>
              <tbody>
                {teamData.hitters?.map(player => (
                  <tr key={player.name} className={player.isStarting ? 'starting-player' : ''}>
                    <td>{player.position}</td>
                    <td className="player-name">{player.name}</td>
                    <td>{player.games}</td>
                    <td>{player.atBats}</td>
                    <td>{player.runs}</td>
                    <td>{player.hits}</td>
                    <td>{player.battingAvg}</td>
                    <td>{player.homeRuns}</td>
                    <td>{player.rbi}</td>
                    <td>{player.stolenBases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="stats-table-container">
            <table className="stats-table pitcher-stats">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Name</th>
                  <th>G</th>
                  <th>IP</th>
                  <th>W</th>
                  <th>L</th>
                  <th>K</th>
                  <th>SV</th>
                  <th>ERA</th>
                  <th>WHIP</th>
                </tr>
              </thead>
              <tbody>
                {teamData.pitchers?.map(player => (
                  <tr key={player.name} className={player.isStarting ? 'starting-player' : ''}>
                    <td>{player.position}</td>
                    <td className="player-name">{player.name}</td>
                    <td>{player.games}</td>
                    <td>{player.inningsPitched}</td>
                    <td>{player.wins}</td>
                    <td>{player.losses}</td>
                    <td>{player.strikeouts}</td>
                    <td>{player.saves}</td>
                    <td>{player.era}</td>
                    <td>{player.whip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabPanel>
        
        <TabPanel>
          <div className="recent-stats-container">
            <div className="yesterday-hitting">
              <h3>Yesterday's Hitting</h3>
              <table className="stats-table yesterday-stats">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stat Line</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.yesterdayHitting?.map((stat, index) => (
                    <tr key={index}>
                      <td className="player-name">{stat.name}</td>
                      <td>{stat.statLine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="yesterday-pitching">
              <h3>Yesterday's Pitching</h3>
              <table className="stats-table yesterday-stats">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stat Line</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.yesterdayPitching?.map((stat, index) => (
                    <tr key={index}>
                      <td className="player-name">{stat.name}</td>
                      <td>{stat.statLine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default TeamDetail;