
// Modello utente: struttura dati, hash password, JWT, ruoli
const mongoose = require('mongoose');
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

module.exports = mongoose.model('User', UserSchema);
