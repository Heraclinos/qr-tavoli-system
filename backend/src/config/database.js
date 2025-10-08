
// Definisce costanti, parametri operativi e i ruoli supportati
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',

  // Configurazioni QR
  QR_CODE_PREFIX: 'TABLE_',
  MAX_POINTS_PER_TRANSACTION: 100,
  MIN_POINTS_PER_TRANSACTION: 1,

  // Configurazioni tavoli
  MAX_TABLES: 50,
  DEFAULT_TABLE_POINTS: 0,

  // Ruoli utente
  USER_ROLES: {
    CUSTOMER: 'customer',
    CASHIER: 'cashier',
    ADMIN: 'admin'
  },

  // Rate limiting
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 100 // max 100 richieste per IP per finestra
  },

  // Configurazioni database
  DB_OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
};
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
