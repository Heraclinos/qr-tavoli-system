// Espone endpoint legati all’autenticazione (/api/auth/register, /login, etc.)
const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  handleValidationErrors,
  sanitizeHtml
} = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Registra nuovo utente
// @access  Public
router.post('/register', 
  sanitizeHtml,
  validateRegister,
  handleValidationErrors,
  register
);

// @route   POST /api/auth/login
// @desc    Login utente
// @access  Public
router.post('/login',
  sanitizeHtml,
  validateLogin,
  handleValidationErrors,
  login
);

// @route   GET /api/auth/me
// @desc    Ottieni profilo utente corrente
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Aggiorna profilo utente
// @access  Private
router.put('/profile',
  protect,
  sanitizeHtml,
  updateProfile
);

// @route   PUT /api/auth/password
// @desc    Cambia password
// @access  Private
router.put('/password',
  protect,
  sanitizeHtml,
  changePassword
);

// @route   POST /api/auth/logout
// @desc    Logout utente
// @access  Private
router.post('/logout', protect, logout);

module.exports = router;
