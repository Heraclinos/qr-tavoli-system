
// Verifica permessi utente: controllo ruoli, autorizzazioni granulari
const config = require('../config/config');

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
};
