
// Protegge le route: verifica token JWT e recupera utente in sessione 
const jwt = require('jsonwebtoken');
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
};
