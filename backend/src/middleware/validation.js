
// Valida e sanitizza input delle richieste API (express-validator, custom)
const { body, param, query, validationResult } = require('express-validator');
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
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password deve contenere almeno una lettera minuscola, maiuscola e un numero'),

  body('firstName')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Nome richiesto (max 30 caratteri)')
    .matches(/^[a-zA-Z\s'àèìòùáéíóúâêîôûãõç-]+$/)
    .withMessage('Nome contiene caratteri non validi'),

  body('lastName')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Cognome richiesto (max 30 caratteri)')
    .matches(/^[a-zA-Z\s'àèìòùáéíóúâêîôûãõç-]+$/)
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
    .matches(/^[a-zA-Z0-9\s'àèìòùáéíóúâêîôûãõç._-]+$/)
    .withMessage('Nome tavolo contiene caratteri non validi')
];

exports.validateQRCode = [
  body('qrCode')
    .trim()
    .matches(/^TABLE_\d+$/)
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
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
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
};
