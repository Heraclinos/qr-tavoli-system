# Creo le routes

# src/routes/auth.js
auth_routes = """const express = require('express');
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

module.exports = router;"""

# src/routes/tables.js
tables_routes = """const express = require('express');
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

module.exports = router;"""

# src/routes/points.js
points_routes = """const express = require('express');
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

module.exports = router;"""

# Creo le cartelle e i file
os.makedirs('src/routes', exist_ok=True)

with open('src/routes/auth.js', 'w', encoding='utf-8') as f:
    f.write(auth_routes)

with open('src/routes/tables.js', 'w', encoding='utf-8') as f:
    f.write(tables_routes)

with open('src/routes/points.js', 'w', encoding='utf-8') as f:
    f.write(points_routes)

print("✅ Creato src/routes/auth.js")
print("✅ Creato src/routes/tables.js")
print("✅ Creato src/routes/points.js")
print("🛤️ Routes con:")
print("- Endpoint autenticazione (register, login, profile)")
print("- Endpoint tavoli (CRUD, classifica, QR lookup)")
print("- Endpoint punti (add, redeem, stats, transactions)")
print("- Middleware di validazione e controllo ruoli")
print("- Sanitizzazione input per sicurezza")