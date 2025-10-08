
 // Entry point dell’app: avvia il server, gestisce errori globali, collega Express e DB
 
const app = require('./src/app');
const connectDB = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Connessione al database
connectDB();

// Avvio del server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 QR Tavoli API - Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Gestione errori non catturati
process.on('unhandledRejection', (err) => {
  console.log('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log('❌ Uncaught Exception:', err.message);
  process.exit(1);
});
