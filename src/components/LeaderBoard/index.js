import React, { useState, useEffect } from 'react';
import { getLeaderBoard, getLeagueDates } from '../../api/api-client';
import MLBRssFeed from './MLBRssFeed'; // adjust path as needed
import './LeaderBoard.css';

const LeaderBoard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leagueDateData, setLeagueDateData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const data = await getLeaderBoard();
        
        // Sort by total points in descending order (if not already sorted)
        const sortedData = [...data].sort((a, b) => 
          parseFloat(b.total_pts) - parseFloat(a.total_pts)
        );
        
        setLeaderboardData(sortedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError('Failed to load leaderboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const fetchLeagueDates = async () => {
      try {
        setIsLoading(true);
        const data = await getLeagueDates();
        
        setLeagueDateData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching leaguedate data:', err);
        setError('Failed to load leaguedate data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagueDates();
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className="leaderboard-container">
        <h2>League Standings</h2>
        <div className="loading-indicator">Loading standings...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="leaderboard-container">
        <h2>League Standings</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <table>
        <tbody>
          <td width="20%" valign="top">
            <h2>League Standings</h2>
            
            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((team, index) => (
                    <tr 
                      key={team.team_name}
                      className={index < 3 ? 'playoff-position' : ''}
                    >
                      <td className="rank-cell">{index + 1}</td>
                      <td className="team-name-cell">{team.team_name}</td>
                      <td className="points-cell">{parseFloat(team.total_pts).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="leaderboard-footer">
              <div className="legend">
                <div className="legend-item">
                  <span className="playoff-indicator"></span>
                  <span>Playoff Position</span>
                </div>
              </div>
              <div className="last-updated">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </td>
          <td width="60%" valign="top">
            <h2>Important League Dates</h2>

            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <tbody>
                  {leagueDateData.map((dates, index) => (
                    <tr>
                      <td className="team-name-cell">{dates.league_date_text}</td>
                      <td className="points-cell">{dates.league_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
          <td width="20%" valign="top">
            <div>News from around the MLB</div>
            <MLBRssFeed />
          </td>
        </tbody>      
      </table>
    </div>

    
  );
};

export default LeaderBoard;