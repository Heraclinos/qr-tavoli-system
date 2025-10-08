
// Gestisce assegnazione/riscatto/reset punti, statistiche, transazioni
const Table = require('../models/Table');
const PointTransaction = require('../models/PointTransaction');
const config = require('../config/config');

// @desc    Aggiungi punti a un tavolo
// @route   POST /api/points/add
// @access  Private (Cashier/Admin)
exports.addPoints = async (req, res) => {
  try {
    const { qrCode, points, description } = req.body;

    // Trova tavolo tramite QR code
    const table = await Table.findByQR(qrCode);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'QR code non valido o tavolo non trovato'
      });
    }

    // Salva i punti precedenti per la transazione
    const previousPoints = table.points;

    // Aggiungi punti al tavolo
    await table.addPoints(points, req.user.id);

    // Crea record della transazione
    const transaction = await PointTransaction.create({
      table: table._id,
      assignedBy: req.user.id,
      points: points,
      type: 'EARNED',
      description: description || `Punti assegnati da ${req.user.fullName}`,
      metadata: {
        previousPoints,
        newPoints: table.points,
        timestamp: new Date()
      }
    });

    // Popola i dati per la risposta
    await transaction.populate([
      { path: 'table', select: 'tableNumber name points' },
      { path: 'assignedBy', select: 'username firstName lastName' }
    ]);

    res.json({
      success: true,
      message: `${points} punti aggiunti con successo al ${table.name}`,
      data: {
        table: {
          id: table._id,
          tableNumber: table.tableNumber,
          name: table.name,
          points: table.points,
          previousPoints
        },
        transaction
      }
    });

  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'assegnazione punti'
    });
  }
};

// @desc    Aggiungi punti tramite ID tavolo
// @route   POST /api/points/table/:tableId
// @access  Private (Cashier/Admin)
exports.addPointsToTable = async (req, res) => {
  try {
    const { points, description } = req.body;
    const { tableId } = req.params;

    const table = await Table.findById(tableId);

    if (!table || !table.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tavolo non trovato'
      });
    }

    const previousPoints = table.points;

    // Aggiungi punti
    await table.addPoints(points, req.user.id);

    // Crea transazione
    const transaction = await PointTransaction.create({
      table: table._id,
      assignedBy: req.user.id,
      points: points,
      type: 'EARNED',
      description: description || `Punti assegnati da ${req.user.fullName}`,
      metadata: {
        previousPoints,
        newPoints: table.points,
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: `${points} punti aggiunti con successo`,
      data: {
        table: {
          id: table._id,
          tableNumber: table.tableNumber,
          name: table.name,
          points: table.points,
          previousPoints
        },
        transaction: transaction._id
      }
    });

  } catch (error) {
    console.error('Add points to table error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'assegnazione punti'
    });
  }
};

// @desc    Sottrai punti da un tavolo (riscatto premi)
// @route   POST /api/points/redeem
// @access  Private (Cashier/Admin)
exports.redeemPoints = async (req, res) => {
  try {
    const { qrCode, points, description } = req.body;

    const table = await Table.findByQR(qrCode);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'QR code non valido o tavolo non trovato'
      });
    }

    if (table.points < points) {
      return res.status(400).json({
        success: false,
        message: `Punti insufficienti. Disponibili: ${table.points}, richiesti: ${points}`
      });
    }

    const previousPoints = table.points;

    // Sottrai punti
    table.points -= points;
    table.lastPointsUpdate = new Date();
    await table.save();

    // Crea transazione
    const transaction = await PointTransaction.create({
      table: table._id,
      assignedBy: req.user.id,
      points: points,
      type: 'REDEEMED',
      description: description || `Punti riscattati da ${req.user.fullName}`,
      metadata: {
        previousPoints,
        newPoints: table.points,
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: `${points} punti riscattati con successo`,
      data: {
        table: {
          id: table._id,
          tableNumber: table.tableNumber,
          name: table.name,
          points: table.points,
          previousPoints
        },
        transaction: transaction._id
      }
    });

  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel riscatto punti'
    });
  }
};

// @desc    Ottieni tutte le transazioni
// @route   GET /api/points/transactions
// @access  Private (Cashier/Admin)
exports.getTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      tableId, 
      userId 
    } = req.query;

    const query = {};

    if (type) query.type = type;
    if (tableId) query.table = tableId;
    if (userId) query.assignedBy = userId;

    const transactions = await PointTransaction.find(query)
      .populate('table', 'tableNumber name')
      .populate('assignedBy', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PointTransaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: transactions
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero transazioni'
    });
  }
};

// @desc    Ottieni statistiche punti giornaliere
// @route   GET /api/points/stats/daily
// @access  Private (Cashier/Admin)
exports.getDailyStats = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const stats = await PointTransaction.getDailyStats(targetDate);

    // Formatta statistiche
    const formattedStats = {
      date: targetDate.toISOString().split('T')[0],
      totalTransactions: 0,
      pointsEarned: 0,
      pointsRedeemed: 0,
      netPoints: 0
    };

    stats.forEach(stat => {
      formattedStats.totalTransactions += stat.transactionCount;

      if (stat._id === 'EARNED') {
        formattedStats.pointsEarned = stat.totalPoints;
      } else if (stat._id === 'REDEEMED') {
        formattedStats.pointsRedeemed = stat.totalPoints;
      }
    });

    formattedStats.netPoints = formattedStats.pointsEarned - formattedStats.pointsRedeemed;

    res.json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero statistiche'
    });
  }
};

// @desc    Ottieni statistiche utente (cassiere)
// @route   GET /api/points/stats/user
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Solo admin può vedere stats di altri utenti
    if (userId !== req.user.id && req.user.role !== config.USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato a visualizzare queste statistiche'
      });
    }

    const stats = await PointTransaction.aggregate([
      {
        $match: { assignedBy: mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: '$type',
          totalPoints: { $sum: '$points' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Attività recente
    const recentActivity = await PointTransaction.getUserActivity(userId, 10);

    res.json({
      success: true,
      data: {
        stats,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero statistiche utente'
    });
  }
};

// @desc    Reset punti tavolo (solo admin)
// @route   POST /api/points/reset/:tableId
// @access  Private (Admin only)
exports.resetTablePoints = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { reason } = req.body;

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Tavolo non trovato'
      });
    }

    const previousPoints = table.points;

    // Reset punti a 0
    table.points = 0;
    table.lastPointsUpdate = new Date();
    await table.save();

    // Crea transazione di adjustment
    await PointTransaction.create({
      table: table._id,
      assignedBy: req.user.id,
      points: previousPoints,
      type: 'ADJUSTMENT',
      description: `Reset punti: ${reason || 'Nessuna ragione specificata'}`,
      metadata: {
        previousPoints,
        newPoints: 0,
        timestamp: new Date()
      }
    });

    res.json({
      success: true,
      message: `Punti del tavolo ${table.name} resettati con successo`,
      data: {
        table: {
          id: table._id,
          name: table.name,
          previousPoints,
          newPoints: 0
        }
      }
    });

  } catch (error) {
    console.error('Reset table points error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel reset punti tavolo'
    });
  }
};
