# Creo i controller

# src/controllers/authController.js
auth_controller = """const User = require('../models/User');
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
        message: 'Account disattivato. Contattare l\\'amministratore.'
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
      message: 'Errore nell\\'aggiornamento del profilo'
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
};"""

# src/controllers/tableController.js
table_controller = """const Table = require('../models/Table');
const PointTransaction = require('../models/PointTransaction');

// @desc    Ottieni classifica tavoli
// @route   GET /api/tables/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const tables = await Table.getLeaderboard()
      .limit(parseInt(limit));

    // Aggiungi posizioni alla classifica
    const leaderboard = tables.map((table, index) => ({
      ...table.toObject(),
      position: index + 1,
      medal: index < 3 ? ['🥇', '🥈', '🥉'][index] : null
    }));

    res.json({
      success: true,
      count: leaderboard.length,
      data: leaderboard
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero classifica'
    });
  }
};

// @desc    Ottieni tutti i tavoli
// @route   GET /api/tables
// @access  Private (Cashier/Admin)
exports.getTables = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = '-points',
      isActive = true 
    } = req.query;

    const query = { isActive: isActive === 'true' };
    
    const tables = await Table.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('tableNumber name qrCode points lastPointsUpdate createdAt');

    const total = await Table.countDocuments(query);

    res.json({
      success: true,
      count: tables.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: tables
    });

  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero tavoli'
    });
  }
};

// @desc    Ottieni singolo tavolo
// @route   GET /api/tables/:id
// @access  Private
exports.getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Tavolo non trovato'
      });
    }

    res.json({
      success: true,
      data: table
    });

  } catch (error) {
    console.error('Get table error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Tavolo non trovato'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Errore nel recupero tavolo'
    });
  }
};

// @desc    Trova tavolo tramite QR code
// @route   GET /api/tables/qr/:qrCode
// @access  Public
exports.getTableByQR = async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    const table = await Table.findByQR(qrCode);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'QR code non valido o tavolo non trovato'
      });
    }

    // Calcola posizione in classifica
    const betterTables = await Table.countDocuments({
      isActive: true,
      $or: [
        { points: { $gt: table.points } },
        { 
          points: table.points, 
          lastPointsUpdate: { $lt: table.lastPointsUpdate }
        }
      ]
    });

    const tableWithPosition = {
      ...table.toObject(),
      position: betterTables + 1,
      medal: betterTables < 3 ? ['🥇', '🥈', '🥉'][betterTables] : null
    };

    res.json({
      success: true,
      data: tableWithPosition
    });

  } catch (error) {
    console.error('Get table by QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella ricerca tramite QR code'
    });
  }
};

// @desc    Crea nuovo tavolo
// @route   POST /api/tables
// @access  Private (Admin)
exports.createTable = async (req, res) => {
  try {
    const { tableNumber, name } = req.body;

    // Controllo se numero tavolo già esiste
    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: 'Numero tavolo già esistente'
      });
    }

    const table = await Table.create({
      tableNumber,
      name: name || `Tavolo ${tableNumber}`,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Tavolo creato con successo',
      data: table
    });

  } catch (error) {
    console.error('Create table error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Numero tavolo o QR code già esistente'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Errore nella creazione tavolo'
    });
  }
};

// @desc    Aggiorna nome tavolo
// @route   PUT /api/tables/:id/name
// @access  Private (Customer for their table, Admin for all)
exports.updateTableName = async (req, res) => {
  try {
    const { name } = req.body;
    
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Tavolo non trovato'
      });
    }

    await table.updateName(name);

    res.json({
      success: true,
      message: 'Nome tavolo aggiornato con successo',
      data: table
    });

  } catch (error) {
    console.error('Update table name error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\\'aggiornamento nome tavolo'
    });
  }
};

// @desc    Elimina tavolo (soft delete)
// @route   DELETE /api/tables/:id
// @access  Private (Admin)
exports.deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Tavolo non trovato'
      });
    }

    // Soft delete
    table.isActive = false;
    await table.save();

    res.json({
      success: true,
      message: 'Tavolo eliminato con successo'
    });

  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\\'eliminazione tavolo'
    });
  }
};

// @desc    Ottieni storico transazioni tavolo
// @route   GET /api/tables/:id/history
// @access  Private (Cashier/Admin)
exports.getTableHistory = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const history = await PointTransaction.getTableHistory(
      req.params.id, 
      parseInt(limit)
    );

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (error) {
    console.error('Get table history error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero storico tavolo'
    });
  }
};"""

os.makedirs('src/controllers', exist_ok=True)

with open('src/controllers/authController.js', 'w', encoding='utf-8') as f:
    f.write(auth_controller)

with open('src/controllers/tableController.js', 'w', encoding='utf-8') as f:
    f.write(table_controller)

print("✅ Creato src/controllers/authController.js")
print("✅ Creato src/controllers/tableController.js")
print("🎮 Controller con:")
print("- Registrazione e login utenti")
print("- Gestione profili e password")
print("- CRUD completo per tavoli")
print("- Ricerca tavolo tramite QR code")
print("- Classifica punti con posizioni")
print("- Storico transazioni")