# Creo i middleware

# src/middleware/auth.js
auth_middleware = """const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Middleware per proteggere le route
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Controllo header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Controllo cookie (opzionale)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accesso negato. Token non fornito.'
      });
    }

    try {
      // Verifica token
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Trova utente e controlla se è attivo
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Token non valido o utente non attivo.'
        });
      }

      // Aggiungi utente alla request
      req.user = user;
      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token non valido.'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// Middleware opzionale per ottenere utente se presente
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalido, ma continuiamo senza errore
        console.log('Optional auth: invalid token');
      }
    }

    next();
  } catch (error) {
    next();
  }
};"""

# src/middleware/roleCheck.js  
role_middleware = """const config = require('../config/config');

// Middleware per controllare ruoli specifici
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Accesso negato. Autenticazione richiesta.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accesso negato. Ruolo '${req.user.role}' non autorizzato per questa operazione.`
      });
    }

    next();
  };
};

// Middleware specifici per ruoli comuni
exports.requireCashier = exports.authorize(config.USER_ROLES.CASHIER, config.USER_ROLES.ADMIN);

exports.requireAdmin = exports.authorize(config.USER_ROLES.ADMIN);

exports.requireCashierOrCustomer = exports.authorize(
  config.USER_ROLES.CASHIER, 
  config.USER_ROLES.CUSTOMER, 
  config.USER_ROLES.ADMIN
);

// Middleware per verificare se l'utente può modificare un tavolo
exports.canModifyTable = async (req, res, next) => {
  try {
    const { tableId } = req.params;
    
    // Admin può modificare tutti i tavoli
    if (req.user.role === config.USER_ROLES.ADMIN) {
      return next();
    }
    
    // Cassiere può assegnare punti
    if (req.user.role === config.USER_ROLES.CASHIER && req.method === 'POST' && req.path.includes('points')) {
      return next();
    }
    
    // Cliente può modificare solo il nome del tavolo (implementare logica specifica se necessario)
    if (req.user.role === config.USER_ROLES.CUSTOMER) {
      // Qui puoi aggiungere logica per verificare se il cliente può modificare questo tavolo
      // Per ora permettiamo a tutti i clienti di modificare nomi tavoli
      if (req.method === 'PUT' && req.body.name) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      message: 'Non autorizzato a modificare questo tavolo.'
    });
    
  } catch (error) {
    console.error('Role check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore nel controllo autorizzazioni'
    });
  }
};"""

# src/middleware/validation.js
validation_middleware = """const { body, param, query, validationResult } = require('express-validator');
const config = require('../config/config');

// Middleware per gestire errori di validazione
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Errori di validazione',
      errors: errorMessages
    });
  }
  
  next();
};

// Validazioni per autenticazione
exports.validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username deve avere tra 3 e 20 caratteri')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username può contenere solo lettere, numeri, trattini e underscore'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Inserire un indirizzo email valido'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password deve avere almeno 6 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/)
    .withMessage('Password deve contenere almeno una lettera minuscola, maiuscola e un numero'),
    
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Nome richiesto (max 30 caratteri)')
    .matches(/^[a-zA-Z\\s'àèìòùáéíóúâêîôûãõç-]+$/)
    .withMessage('Nome contiene caratteri non validi'),
    
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Cognome richiesto (max 30 caratteri)')
    .matches(/^[a-zA-Z\\s'àèìòùáéíóúâêîôûãõç-]+$/)
    .withMessage('Cognome contiene caratteri non validi'),
    
  body('role')
    .optional()
    .isIn(Object.values(config.USER_ROLES))
    .withMessage('Ruolo non valido')
];

exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Inserire un indirizzo email valido'),
    
  body('password')
    .notEmpty()
    .withMessage('Password richiesta')
];

// Validazioni per tavoli
exports.validateCreateTable = [
  body('tableNumber')
    .isInt({ min: 1 })
    .withMessage('Numero tavolo deve essere un numero positivo'),
    
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nome tavolo richiesto (max 50 caratteri)')
];

exports.validateUpdateTableName = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Nome tavolo richiesto (max 50 caratteri)')
    .matches(/^[a-zA-Z0-9\\s'àèìòùáéíóúâêîôûãõç._-]+$/)
    .withMessage('Nome tavolo contiene caratteri non validi')
];

exports.validateQRCode = [
  body('qrCode')
    .trim()
    .matches(/^TABLE_\\d+$/)
    .withMessage('Codice QR non valido (formato: TABLE_numero)')
];

// Validazioni per punti
exports.validateAddPoints = [
  body('points')
    .isInt({ min: config.MIN_POINTS_PER_TRANSACTION, max: config.MAX_POINTS_PER_TRANSACTION })
    .withMessage(`Punti devono essere tra ${config.MIN_POINTS_PER_TRANSACTION} e ${config.MAX_POINTS_PER_TRANSACTION}`),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Descrizione non può superare i 200 caratteri')
];

// Validazioni parametri URL
exports.validateTableId = [
  param('tableId')
    .isMongoId()
    .withMessage('ID tavolo non valido')
];

exports.validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('ID utente non valido')
];

// Validazioni query parameters
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pagina deve essere un numero positivo'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve essere tra 1 e 100'),
    
  query('sort')
    .optional()
    .isIn(['points', 'name', 'createdAt', 'lastPointsUpdate'])
    .withMessage('Ordinamento non valido')
];

// Sanitizzazione input
exports.sanitizeHtml = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '');
    }
    return value;
  };

  // Sanitizza body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      req.body[key] = sanitizeValue(req.body[key]);
    });
  }
  
  next();
};"""

# Creo le cartelle e i file
os.makedirs('src/middleware', exist_ok=True)

with open('src/middleware/auth.js', 'w', encoding='utf-8') as f:
    f.write(auth_middleware)

with open('src/middleware/roleCheck.js', 'w', encoding='utf-8') as f:
    f.write(role_middleware)

with open('src/middleware/validation.js', 'w', encoding='utf-8') as f:
    f.write(validation_middleware)

print("✅ Creato src/middleware/auth.js")
print("✅ Creato src/middleware/roleCheck.js")
print("✅ Creato src/middleware/validation.js")
print("🛡️ Middleware con:")
print("- Autenticazione JWT con controllo token")
print("- Controllo ruoli (cassiere, cliente, admin)")
print("- Validazione input con express-validator")
print("- Sanitizzazione per sicurezza")
print("- Gestione errori di validazione")