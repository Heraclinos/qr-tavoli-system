# Creo server.js - Entry point dell'applicazione

server_js = """const app = require('./src/app');
const connectDB = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Connessione al database
connectDB();

// Avvio del server
app.listen(PORT, () => {
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
});"""

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(server_js)

print("✅ Creato server.js")

# Creo src/app.js - Configurazione Express

app_js = """const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/tables');
const pointsRoutes = require('./routes/points');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // limite di 100 richieste per IP per finestra
  message: 'Troppe richieste da questo IP, riprova tra 15 minuti.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'QR Tavoli API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/points', pointsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🍽️ QR Tavoli API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trovato'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Errore interno del server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;"""

import os
os.makedirs('src', exist_ok=True)

with open('src/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print("✅ Creato src/app.js")
print("🔧 Configurazione Express con:")
print("- Middleware di sicurezza (helmet, cors, rate limiting)")
print("- Parsing JSON/URL-encoded")
print("- Logging con Morgan")
print("- Routes per auth, tables, points")
print("- Error handling globale")