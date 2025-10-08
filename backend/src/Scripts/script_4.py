# Creo i modelli Mongoose

# src/models/Table.js
table_model = """const mongoose = require('mongoose');

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

module.exports = mongoose.model('Table', TableSchema);"""

# src/models/User.js
user_model = """const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username richiesto'],
    unique: true,
    trim: true,
    minlength: [3, 'Username deve avere almeno 3 caratteri'],
    maxlength: [20, 'Username non può superare i 20 caratteri']
  },
  email: {
    type: String,
    required: [true, 'Email richiesta'],
    unique: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Inserire un indirizzo email valido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password richiesta'],
    minlength: [6, 'Password deve avere almeno 6 caratteri'],
    select: false // Non inclusa nelle query di default
  },
  role: {
    type: String,
    enum: {
      values: Object.values(config.USER_ROLES),
      message: 'Ruolo non valido'
    },
    default: config.USER_ROLES.CASHIER
  },
  firstName: {
    type: String,
    required: [true, 'Nome richiesto'],
    trim: true,
    maxlength: [30, 'Nome non può superare i 30 caratteri']
  },
  lastName: {
    type: String,
    required: [true, 'Cognome richiesto'],
    trim: true,
    maxlength: [30, 'Cognome non può superare i 30 caratteri']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indici
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });

// Middleware pre-save per hash password
UserSchema.pre('save', async function(next) {
  // Solo se la password è stata modificata
  if (!this.isModified('password')) {
    next();
  }

  // Hash password con costo 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Metodo per confrontare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Metodo per generare JWT token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      username: this.username
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE }
  );
};

// Virtual per nome completo
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Metodi statici
UserSchema.statics.findActiveByRole = function(role) {
  return this.find({ role, isActive: true });
};

module.exports = mongoose.model('User', UserSchema);"""

# src/models/PointTransaction.js
transaction_model = """const mongoose = require('mongoose');

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

module.exports = mongoose.model('PointTransaction', PointTransactionSchema);"""

# Creo le cartelle e i file
os.makedirs('src/models', exist_ok=True)

with open('src/models/Table.js', 'w', encoding='utf-8') as f:
    f.write(table_model)

with open('src/models/User.js', 'w', encoding='utf-8') as f:
    f.write(user_model)

with open('src/models/PointTransaction.js', 'w', encoding='utf-8') as f:
    f.write(transaction_model)

print("✅ Creato src/models/Table.js")
print("✅ Creato src/models/User.js") 
print("✅ Creato src/models/PointTransaction.js")
print("🏗️ Modelli Mongoose con:")
print("- Schema tavoli con punti e QR codes")
print("- Schema utenti con ruoli e autenticazione")
print("- Schema transazioni per tracking punti")
print("- Indici per performance")
print("- Metodi helper e validazione")