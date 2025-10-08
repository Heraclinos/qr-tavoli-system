
//Modello tavoli: definisce struttura, attributi (punti, QR, nome), metodi
const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: [true, 'Numero tavolo richiesto'],
    unique: true,
    min: [1, 'Il numero del tavolo deve essere maggiore di 0']
  },
  name: {
    type: String,
    required: [true, 'Nome tavolo richiesto'],
    trim: true,
    maxlength: [50, 'Il nome del tavolo non può superare i 50 caratteri']
  },
  qrCode: {
    type: String,
    required: [true, 'Codice QR richiesto'],
    unique: true,
    uppercase: true
  },
  points: {
    type: Number,
    default: 0,
    min: [0, 'I punti non possono essere negativi']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastPointsUpdate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indici per performance
TableSchema.index({ tableNumber: 1 });
TableSchema.index({ qrCode: 1 });
TableSchema.index({ points: -1 }); // Per classifiche

// Virtual per formattazione QR code
TableSchema.virtual('formattedQR').get(function() {
  return `TABLE_${this.tableNumber}`;
});

// Middleware pre-save per generare QR code
TableSchema.pre('save', function(next) {
  if (!this.qrCode) {
    this.qrCode = `TABLE_${this.tableNumber}`;
  }
  next();
});

// Metodi statici
TableSchema.statics.getLeaderboard = function() {
  return this.find({ isActive: true })
    .sort({ points: -1, lastPointsUpdate: 1 })
    .select('tableNumber name points lastPointsUpdate');
};

TableSchema.statics.findByQR = function(qrCode) {
  return this.findOne({ qrCode: qrCode.toUpperCase(), isActive: true });
};

// Metodi d'istanza
TableSchema.methods.addPoints = function(points, userId) {
  this.points += points;
  this.lastPointsUpdate = new Date();
  return this.save();
};

TableSchema.methods.updateName = function(newName) {
  this.name = newName.trim();
  return this.save();
};

module.exports = mongoose.model('Table', TableSchema);
