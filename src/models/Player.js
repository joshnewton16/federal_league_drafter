/**
 * Player model for fantasy baseball
 * Adapted to work with the existing database schema
 */
export class Player {
  constructor(data) {
    // Ensure data is an object
    data = data || {};
    
    // Map from database fields
    this.id = data.player_id || null;
    this.firstName = data.player_first_name || '';
    this.lastName = data.player_last_name || '';
    this.name = this.formatName(data);
    this.teamId = data.team_id || null;
    
    // Position is derived from boolean flags
    this.position = this.determinePosition(data);
    
    // MLB API data
    this.mlbId = data.py_mlb_lookup || null;
    this.mlbTeam = data.player_api_lookup || '';
    this.altMlbLookup = data.alt_player_api_lookup || '';
    
    // Additional fields
    this.daCsv = data.dacsv || '';
  }

  /**
   * Format player name from components
   * @param {Object} data - Player data
   * @returns {string} Formatted name
   */
  formatName(data) {
    // If a full name is provided, use it
    if (data.name) return data.name;
    
    const firstName = data.player_first_name || '';
    const lastName = data.player_last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim();
    } else if (lastName) {
      return lastName.trim();
    } else if (firstName) {
      return firstName.trim();
    }
    
    return '';
  }

  /**
   * Determine the primary position based on boolean flags
   * @param {Object} data - Player data with position boolean flags
   * @returns {string} Position abbreviation
   */
  determinePosition(data) {
    // If position is already provided, use it
    if (data.position) return data.position;
    
    // Check each boolean position flag
    if (data.bln_p === true) return 'P';
    if (data.bln_c === true) return 'C';
    if (data.bln_1b === true) return '1B';
    if (data.bln_2b === true) return '2B';
    if (data.bln_ss === true) return 'SS';
    if (data.bln_3b === true) return '3B';
    if (data.bln_of === true) return 'OF';
    if (data.bln_u === true) return 'UTIL';
    
    return '';
  }

  /**
   * Set a specific position for this player
   * @param {string} position - Position abbreviation (P, C, 1B, etc.)
   */
  setPosition(position) {
    this.position = position;
  }

  /**
   * Get the full name of this player
   * @returns {string} Full name (firstName + lastName)
   */
  getFullName() {
    return this.name;
  }

  /**
   * Convert Player to database format for create/update operations
   * @returns {Object} Database-ready object
   */
  toDatabase() {
    // Create the position boolean mapping
    const positionFlags = {
      bln_p: this.position === 'P',
      bln_c: this.position === 'C',
      bln_1b: this.position === '1B',
      bln_2b: this.position === '2B',
      bln_ss: this.position === 'SS',
      bln_3b: this.position === '3B',
      bln_of: this.position === 'OF',
      bln_u: this.position === 'UTIL'
    };
    
    return {
      team_id: this.teamId,
      player_first_name: this.firstName,
      player_last_name: this.lastName,
      player_api_lookup: this.mlbTeam,
      py_mlb_lookup: this.mlbId,
      alt_player_api_lookup: this.altMlbLookup,
      dacsv: this.daCsv,
      ...positionFlags
    };
  }
}

/**
 * Create Player from database object
 * @param {Object} data - Database player object
 * @returns {Player} Player instance
 */
export function fromDatabase(data) {
  return new Player(data);
}

/**
 * Create Player from MLB API data
 * @param {Object} mlbData - MLB API player data
 * @returns {Player} Player instance
 */
export function fromMLBApi(mlbData) {
  // Ensure mlbData is an object
  mlbData = mlbData || {};
  
  // Split name into first and last
  let firstName = '';
  let lastName = '';
  
  if (mlbData.fullName || mlbData.name) {
    const fullName = mlbData.fullName || mlbData.name || '';
    const nameParts = fullName.split(' ');
    if (nameParts.length > 1) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    } else {
      lastName = fullName;
    }
  }
  
  // Determine position flag based on mlbData.position
  const position = mlbData.position || '';
  
  return new Player({
    player_first_name: firstName,
    player_last_name: lastName,
    player_api_lookup: mlbData.mlbTeam || mlbData.mlbTeamName || '',
    py_mlb_lookup: mlbData.id || mlbData.mlbId,
    position: position,
    // Set the appropriate position flag
    bln_p: position === 'P',
    bln_c: position === 'C',
    bln_1b: position === '1B',
    bln_2b: position === '2B',
    bln_ss: position === 'SS',
    bln_3b: position === '3B',
    bln_of: position === 'OF' || position === 'LF' || position === 'CF' || position === 'RF',
    bln_u: position === 'UTIL' || position === 'DH'
  });
}

// Default export
export default Player;