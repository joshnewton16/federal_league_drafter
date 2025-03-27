/**
 * Formats a date string in MM/DD/YYYY format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

/**
 * Calculates age based on birth date
 * @param {string} birthDate - ISO date string of birth date
 * @returns {number} Age in years
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format player positions for display
 * @param {string} position - Position abbreviation
 * @returns {string} Full position name
 */
export const formatPosition = (position) => {
  const positions = {
    'P': 'Pitcher',
    'C': 'Catcher',
    '1B': 'First Base',
    '2B': 'Second Base',
    '3B': 'Third Base',
    'SS': 'Shortstop',
    'LF': 'Left Field',
    'CF': 'Center Field',
    'RF': 'Right Field',
    'OF': 'Outfield',
    'DH': 'Designated Hitter',
    'UTIL': 'Utility'
  };
  
  return positions[position] || position;
};

/**
 * Get position color for visual indicators
 * @param {string} position - Position abbreviation
 * @returns {string} CSS color value
 */
export const getPositionColor = (position) => {
  const colors = {
    'P': '#e74c3c',     // Red
    'C': '#3498db',     // Blue
    '1B': '#2ecc71',    // Green
    '2B': '#9b59b6',    // Purple
    '3B': '#f1c40f',    // Yellow
    'SS': '#e67e22',    // Orange
    'OF': '#1abc9c',    // Teal
    'LF': '#1abc9c',    // Teal
    'CF': '#1abc9c',    // Teal
    'RF': '#1abc9c',    // Teal
    'DH': '#95a5a6',    // Gray
    'UTIL': '#7f8c8d'   // Dark Gray
  };
  
  return colors[position] || '#34495e';
};

/**
 * Sort players by position priority
 * @param {Array} players - Array of player objects
 * @returns {Array} Sorted array of players
 */
export const sortPlayersByPosition = (players) => {
  const positionOrder = ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'UTIL', 'P'];
  
  return [...players].sort((a, b) => {
    const posA = positionOrder.indexOf(a.position);
    const posB = positionOrder.indexOf(b.position);
    
    // If positions are different, sort by position order
    if (posA !== posB) {
      return posA - posB;
    }
    
    // If positions are the same, sort by name
    return a.playerName?.localeCompare(b.playerName);
  });
};

/**
 * Calculate fantasy points based on player stats
 * @param {Object} stats - Player statistics object
 * @param {string} position - Player position
 * @param {Object} scoringRules - League scoring rules
 * @returns {number} Fantasy points
 */
export const calculateFantasyPoints = (stats, position, scoringRules = {}) => {
  if (!stats) return 0;
  
  // Default scoring rules
  const defaultRules = {
    batting: {
      run: 1,
      rbi: 1,
      homeRun: 4,
      stolenBase: 2,
      hit: 1,
      double: 1,
      triple: 2,
      walk: 1,
      hitByPitch: 1,
      strikeout: -0.5
    },
    pitching: {
      win: 5,
      save: 5,
      inningPitched: 1,
      strikeout: 1,
      qualityStart: 3,
      earnedRun: -1,
      hit: -0.5,
      walk: -0.5,
      hitBatsman: -0.5,
      completeGame: 5,
      shutout: 5
    }
  };
  
  // Merge default rules with custom rules
  const rules = {
    batting: { ...defaultRules.batting, ...scoringRules.batting },
    pitching: { ...defaultRules.pitching, ...scoringRules.pitching }
  };
  
  // Calculate points based on position
  let points = 0;
  
  if (position === 'P') {
    // Pitching stats
    points += (stats.wins || 0) * rules.pitching.win;
    points += (stats.saves || 0) * rules.pitching.save;
    points += (stats.inningsPitched || 0) * rules.pitching.inningPitched;
    points += (stats.strikeOuts || 0) * rules.pitching.strikeout;
    points += (stats.qualityStarts || 0) * rules.pitching.qualityStart;
    points += (stats.earnedRuns || 0) * rules.pitching.earnedRun;
    points += (stats.hits || 0) * rules.pitching.hit;
    points += (stats.baseOnBalls || 0) * rules.pitching.walk;
    points += (stats.hitBatsmen || 0) * rules.pitching.hitBatsman;
    points += (stats.completeGames || 0) * rules.pitching.completeGame;
    points += (stats.shutouts || 0) * rules.pitching.shutout;
  } else {
    // Batting stats
    points += (stats.runs || 0) * rules.batting.run;
    points += (stats.rbi || 0) * rules.batting.rbi;
    points += (stats.homeRuns || 0) * rules.batting.homeRun;
    points += (stats.stolenBases || 0) * rules.batting.stolenBase;
    points += (stats.hits || 0) * rules.batting.hit;
    points += (stats.doubles || 0) * rules.batting.double;
    points += (stats.triples || 0) * rules.batting.triple;
    points += (stats.baseOnBalls || 0) * rules.batting.walk;
    points += (stats.hitByPitch || 0) * rules.batting.hitByPitch;
    points += (stats.strikeOuts || 0) * rules.batting.strikeout;
  }
  
  return parseFloat(points.toFixed(1));
};

/**
 * Generate a random team name for new fantasy teams
 * @returns {string} Random team name
 */
export const generateRandomTeamName = () => {
  const adjectives = [
    'Mighty', 'Fierce', 'Blazing', 'Raging', 'Thundering', 'Soaring',
    'Charging', 'Striking', 'Roaring', 'Crushing', 'Flaming', 'Flying'
  ];
  
  const nouns = [
    'Giants', 'Dragons', 'Titans', 'Thunder', 'Hurricanes', 'Warriors',
    'Knights', 'Legends', 'Wolves', 'Bears', 'Eagles', 'Lions'
  ];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adj} ${noun}`;
};