
// Espone endpoint per azioni sui punti (/api/points/add, /transactions, etc.)
const express = require('express');
const {
  addPoints,
  addPointsToTable,
  redeemPoints,
  getTransactions,
  getDailyStats,
  getUserStats,
  resetTablePoints
} = require('../controllers/pointsController');

const { protect } = require('../middleware/auth');
const { authorize, requireAdmin, requireCashier } = require('../middleware/roleCheck');
const {
  validateAddPoints,
  validateQRCode,
  validateTableId,
  validatePagination,
  handleValidationErrors,
  sanitizeHtml
} = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/points/add
// @desc    Aggiungi punti tramite QR code
// @access  Private (Cashier/Admin)
router.post('/add',
  protect,
  requireCashier,
  sanitizeHtml,
  validateQRCode,
  validateAddPoints,
  handleValidationErrors,
  addPoints
);

// @route   POST /api/points/table/:tableId
// @desc    Aggiungi punti tramite ID tavolo
// @access  Private (Cashier/Admin)
router.post('/table/:tableId',
  protect,
  requireCashier,
  sanitizeHtml,
  validateTableId,
  validateAddPoints,
  handleValidationErrors,
  addPointsToTable
);

// @route   POST /api/points/redeem
// @desc    Riscatta punti (sottrai)
// @access  Private (Cashier/Admin)
router.post('/redeem',
  protect,
  requireCashier,
  sanitizeHtml,
  validateQRCode,
  validateAddPoints,
  handleValidationErrors,
  redeemPoints
);

// @route   POST /api/points/reset/:tableId
// @desc    Reset punti tavolo
// @access  Private (Admin)
router.post('/reset/:tableId',
  protect,
  requireAdmin,
  sanitizeHtml,
  validateTableId,
  handleValidationErrors,
  resetTablePoints
);

// @route   GET /api/points/transactions
// @desc    Ottieni tutte le transazioni
// @access  Private (Cashier/Admin)
router.get('/transactions',
  protect,
  authorize('cashier', 'admin'),
  validatePagination,
  handleValidationErrors,
  getTransactions
);

// @route   GET /api/points/stats/daily
// @desc    Statistiche punti giornaliere
// @access  Private (Cashier/Admin)
router.get('/stats/daily',
  protect,
  authorize('cashier', 'admin'),
  getDailyStats
);

// @route   GET /api/points/stats/user/:userId?
// @desc    Statistiche utente
// @access  Private
router.get('/stats/user/:userId?',
  protect,
  getUserStats
);

module.exports = router;
