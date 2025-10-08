
// Gestisce autenticazione, registrazione, login, profilo, cambio password
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// @desc    Registra nuovo utente
// @route   POST /api/auth/register
// @access  Public (per ora, in produzione potrebbe essere limitato)
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Controllo se utente esiste già
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Utente con questa email o username già esistente'
      });
    }

    // Crea utente
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || config.USER_ROLES.CASHIER
    });

    // Genera token
    const token = user.getSignedJwtToken();

    // Rimuovi password dalla risposta
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);

    // Gestione errori di duplicazione MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} già in uso`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante la registrazione'
    });
  }
};

// @desc    Login utente
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trova utente con password inclusa
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Controllo se utente è attivo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account disattivato. Contattare l\'amministratore.'
      });
    }

    // Verifica password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Aggiorna ultimo login
    user.lastLogin = new Date();
    await user.save();

    // Genera token
    const token = user.getSignedJwtToken();

    // Rimuovi password dalla risposta
    user.password = undefined;

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il login'
    });
  }
};

// @desc    Ottieni profilo utente corrente
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero profilo utente'
    });
  }
};

// @desc    Aggiorna profilo utente
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName
    };

    // Rimuovi campi undefined
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Profilo aggiornato con successo',
      data: user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento del profilo'
    });
  }
};

// @desc    Cambia password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Trova utente con password
    const user = await User.findById(req.user.id).select('+password');

    // Verifica password corrente
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password corrente non valida'
      });
    }

    // Aggiorna password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password cambiata con successo'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel cambio password'
    });
  }
};

// @desc    Logout (per future implementazioni con blacklist token)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  // Per ora solo risposta di successo
  // In futuro si può implementare blacklist dei token JWT
  res.json({
    success: true,
    message: 'Logout effettuato con successo'
  });
};
