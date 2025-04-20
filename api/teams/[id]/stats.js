// /api/teams/[id]/stats.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Query database for stats of the specific team
    const result = await sql`
      SELECT 
        wins, 
        losses, 
        points_scored,
        points_against,
        league_standing
      FROM team_stats 
      WHERE team_id = ${id}
    `;
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team stats not found' });
    }
    
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to fetch team stats' });
  }
}