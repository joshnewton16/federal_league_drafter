import React, { useState, useEffect } from 'react';
import { getLeaderBoard } from '../../api/database';
import './LeaderBoard.css';

const LeaderBoard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
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
          <td width="20%">
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
          <td width="60%">

          </td>
          <td width="20%">
            <div>News from around the MLB</div>
            <iframe width="250" height="750" class="rssdog" src="https://www.rssdog.com/index.php?url=https%3A%2F%2Fwww.espn.com%2Fespn%2Frss%2Fmlb%2Fnews&amp;mode=html&amp;showonly=&amp;maxitems=10&amp;showdescs=1&amp;desctrim=0&amp;descmax=0&amp;tabwidth=100%25&amp;linktarget=_blank&amp;bordercol=%23d4d0c8&amp;headbgcol=%23999999&amp;headtxtcol=%23ffffff&amp;titlebgcol=%23f1eded&amp;titletxtcol=%23000000&amp;itembgcol=%23ffffff&amp;itemtxtcol=%23000000&amp;ctl=0"></iframe>
          </td>
        </tbody>      
      </table>
    </div>

    
  );
};

export default LeaderBoard;