
// Espone endpoint gestione tavoli e classifica (/api/tables, /leaderboard, etc.)
const express = require('express');
const {
  getLeaderboard,
  getTables,
  getTable,
  getTableByQR,
  createTable,
  updateTableName,
  deleteTable,
  getTableHistory
} = require('../controllers/tableController');

const { protect } = require('../middleware/auth');
const { authorize, requireAdmin, canModifyTable } = require('../middleware/roleCheck');
const {
  validateCreateTable,
  validateUpdateTableName,
  validateTableId,
  validatePagination,
  handleValidationErrors,
  sanitizeHtml
} = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/tables/leaderboard
// @desc    Ottieni classifica tavoli
// @access  Public
router.get('/leaderboard',
  validatePagination,
  handleValidationErrors,
  getLeaderboard
);

// @route   GET /api/tables/qr/:qrCode
// @desc    Trova tavolo tramite QR code
// @access  Public
router.get('/qr/:qrCode', getTableByQR);

// @route   GET /api/tables
// @desc    Ottieni tutti i tavoli
// @access  Private (Cashier/Admin)
router.get('/',
  protect,
  authorize('cashier', 'admin'),
  validatePagination,
  handleValidationErrors,
  getTables
);

// @route   GET /api/tables/:id
// @desc    Ottieni singolo tavolo
// @access  Private
router.get('/:id',
  protect,
  validateTableId,
  handleValidationErrors,
  getTable
);

// @route   GET /api/tables/:id/history
// @desc    Ottieni storico transazioni tavolo
// @access  Private (Cashier/Admin)
router.get('/:id/history',
  protect,
  authorize('cashier', 'admin'),
  validateTableId,
  handleValidationErrors,
  getTableHistory
);

// @route   POST /api/tables
// @desc    Crea nuovo tavolo
// @access  Private (Admin)
router.post('/',
  protect,
  requireAdmin,
  sanitizeHtml,
  validateCreateTable,
  handleValidationErrors,
  createTable
);

// @route   PUT /api/tables/:id/name
// @desc    Aggiorna nome tavolo
// @access  Private (Customer for their table, Admin for all)
router.put('/:id/name',
  protect,
  canModifyTable,
  sanitizeHtml,
  validateTableId,
  validateUpdateTableName,
  handleValidationErrors,
  updateTableName
);

// @route   DELETE /api/tables/:id
// @desc    Elimina tavolo (soft delete)
// @access  Private (Admin)
router.delete('/:id',
  protect,
  requireAdmin,
  validateTableId,
  handleValidationErrors,
  deleteTable
);

module.exports = router;
