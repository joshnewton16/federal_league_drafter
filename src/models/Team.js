/**
 * Team model for fantasy baseball
 * Adapted to work with the existing database schema
 */
export class Team {
  constructor(data = {}) {
    // Required fields
    this.id = data.team_id || null;
    this.name = data.team_name || '';
    this.ownerId = data.owner_id || null;
    this.yearId = data.year_id || new Date().getFullYear();
    
    // Optional fields with defaults
    this.roster = data.roster || [];
    this.draftPicks = data.draftPicks || [];
  }

  /**
   * Add a player to the team's roster
   * @param {Object} player - Player object
   * @param {number} rosterId - Roster position ID
   */
  addPlayer(player, rosterId) {
    // Add to roster
    this.roster.push({
      playerId: player.id,
      playerName: player.name || `${player.firstName} ${player.lastName}`,
      position: player.position,
      rosterId: rosterId
    });
    
    // Add to draft picks
    this.draftPicks.push({
      team_id: this.id,
      player_id: player.id,
      year_id: this.yearId,
      roster_id: rosterId
    });
  }

  /**
   * Remove a player from the team's roster
   * @param {string} playerId - Player ID
   * @returns {boolean} Whether player was removed
   */
  removePlayer(playerId) {
    const initialLength = this.roster.length;
    this.roster = this.roster.filter(player => player.playerId !== playerId);
    
    return initialLength !== this.roster.length;
  }

  /**
   * Get roster by position
   * @returns {Object} Roster organized by position
   */
  getRosterByPosition() {
    const positions = {
      'P': [],
      'C': [],
      '1B': [],
      '2B': [],
      'SS': [],
      '3B': [],
      'OF': [],
      'UTIL': [],
      'Unknown': []
    };
    
    this.roster.forEach(player => {
      const position = player.position || 'Unknown';
      
      if (positions[position]) {
        positions[position].push(player);
      } else {
        positions['Unknown'].push(player);
      }
    });
    
    return positions;
  }

  /**
   * Convert Team to database format for create/update operations
   * @returns {Object} Database-ready object
   */
  toDatabase() {
    return {
      team_name: this.name,
      owner_id: this.ownerId,
      year_id: this.yearId
    };
  }

  /**
   * Create Team from database object
   * @param {Object} data - Database team object
   * @returns {Team} Team instance
   */
  static fromDatabase(data) {
    return new Team(data);
  }
}

export default Team;