
// Modello transazione: tracking storico punti, metadati, tipo transazione
const mongoose = require('mongoose');

const PointTransactionSchema = new mongoose.Schema({
  table: {
    type: mongoose.Schema.ObjectId,
    ref: 'Table',
    required: [true, 'Tavolo richiesto']
  },
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Utente assegnatore richiesto']
  },
  points: {
    type: Number,
    required: [true, 'Punti richiesti'],
    min: [1, 'I punti devono essere almeno 1']
  },
  type: {
    type: String,
    enum: {
      values: ['EARNED', 'REDEEMED', 'ADJUSTMENT'],
      message: 'Tipo transazione non valido'
    },
    default: 'EARNED'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Descrizione non può superare i 200 caratteri']
  },
  metadata: {
    previousPoints: Number,
    newPoints: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indici per performance e query
PointTransactionSchema.index({ table: 1, createdAt: -1 });
PointTransactionSchema.index({ assignedBy: 1, createdAt: -1 });
PointTransactionSchema.index({ type: 1 });
PointTransactionSchema.index({ createdAt: -1 });

// Middleware pre-save per calcolare metadata
PointTransactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.metadata.previousPoints) {
    try {
      const Table = mongoose.model('Table');
      const table = await Table.findById(this.table);

      if (table) {
        this.metadata.previousPoints = table.points;
        this.metadata.newPoints = table.points + (this.type === 'EARNED' ? this.points : -this.points);
      }
    } catch (error) {
      console.error('Error calculating metadata:', error);
    }
  }
  next();
});

// Metodi statici
PointTransactionSchema.statics.getTableHistory = function(tableId, limit = 10) {
  return this.find({ table: tableId })
    .populate('assignedBy', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit);
};

PointTransactionSchema.statics.getUserActivity = function(userId, limit = 20) {
  return this.find({ assignedBy: userId })
    .populate('table', 'tableNumber name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

PointTransactionSchema.statics.getDailyStats = function(date = new Date()) {
  const startDate = new Date(date.setHours(0, 0, 0, 0));
  const endDate = new Date(date.setHours(23, 59, 59, 999));

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        totalPoints: { $sum: '$points' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('PointTransaction', PointTransactionSchema);
