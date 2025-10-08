
// Fornisce funzioni di utility (formattazione, validazione, paginazione, sanitizzazione)
const crypto = require('crypto');

// Genera ID univoco
exports.generateUniqueId = (length = 8) => {
  return crypto.randomBytes(length).toString('hex').toUpperCase();
};

// Formatta data italiana
exports.formatDateIT = (date) => {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome'
  };

  return new Intl.DateTimeFormat('it-IT', options).format(new Date(date));
};

// Valida codice QR tavolo
exports.validateTableQR = (qrCode) => {
  const qrRegex = /^TABLE_\d+$/;
  return qrRegex.test(qrCode);
};

// Estrai numero tavolo da QR code
exports.extractTableNumber = (qrCode) => {
  const match = qrCode.match(/^TABLE_(\d+)$/);
  return match ? parseInt(match[1]) : null;
};

// Genera codice QR per tavolo
exports.generateTableQR = (tableNumber) => {
  return `TABLE_${tableNumber}`;
};

// Calcola posizione in classifica
exports.calculatePosition = (currentPoints, allTables) => {
  const sortedTables = allTables
    .filter(table => table.isActive)
    .sort((a, b) => {
      if (b.points === a.points) {
        return new Date(a.lastPointsUpdate) - new Date(b.lastPointsUpdate);
      }
      return b.points - a.points;
    });

  const position = sortedTables.findIndex(table => 
    table.points === currentPoints
  ) + 1;

  return {
    position,
    total: sortedTables.length,
    medal: position <= 3 ? ['🥇', '🥈', '🥉'][position - 1] : null
  };
};

// Sanitizza nome tavolo
exports.sanitizeTableName = (name) => {
  if (!name || typeof name !== 'string') {
    return null;
  }

  return name
    .trim()
    .replace(/[<>"'&]/g, '') // Rimuovi caratteri pericolosi
    .substring(0, 50); // Limita lunghezza
};

// Valida punti
exports.validatePoints = (points, min = 1, max = 100) => {
  const numPoints = parseInt(points);

  if (isNaN(numPoints)) {
    return { valid: false, message: 'I punti devono essere un numero' };
  }

  if (numPoints < min) {
    return { valid: false, message: `I punti devono essere almeno ${min}` };
  }

  if (numPoints > max) {
    return { valid: false, message: `I punti non possono superare ${max}` };
  }

  return { valid: true, points: numPoints };
};

// Formatta risposta API standard
exports.formatResponse = (success, data = null, message = '', errors = null) => {
  const response = { success };

  if (message) response.message = message;
  if (data !== null) response.data = data;
  if (errors) response.errors = errors;

  return response;
};

// Pagina risultati
exports.paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

// Calcola statistiche classifica
exports.calculateLeaderboardStats = (tables) => {
  if (!tables || tables.length === 0) {
    return {
      totalTables: 0,
      totalPoints: 0,
      averagePoints: 0,
      topTable: null
    };
  }

  const activeTables = tables.filter(table => table.isActive);
  const totalPoints = activeTables.reduce((sum, table) => sum + table.points, 0);

  return {
    totalTables: activeTables.length,
    totalPoints,
    averagePoints: Math.round(totalPoints / activeTables.length),
    topTable: activeTables.sort((a, b) => b.points - a.points)[0]
  };
};

// Debounce function per limitare chiamate frequenti
exports.debounce = (func, wait) => {
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

// Log formattato per development
exports.devLog = (message, data = null, type = 'info') => {
  if (process.env.NODE_ENV === 'development') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };

    const color = colors[type] || colors.info;
    const timestamp = new Date().toISOString();

    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);

    if (data) {
      console.log(data);
    }
  }
};
