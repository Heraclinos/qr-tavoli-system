
// Gestisce CRUD tavoli, classifica, ricerca QR, cambio nome, storico punti
const Table = require('../models/Table');
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
      message: 'Errore nell\'aggiornamento nome tavolo'
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
      message: 'Errore nell\'eliminazione tavolo'
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
};
