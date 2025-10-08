
 // Entry point dell’app: avvia il server, gestisce errori globali, collega Express e DB
const express = require('express');
require('dotenv').config();

// Crea app direttamente qui (non importare da src/app)
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS manuale
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes di base
app.get('/', (req, res) => {
  res.json({
    message: '🍽️ QR Tavoli API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'QR Tavoli API'
  });
});

// API Routes per il frontend
app.get('/api/tables/leaderboard', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: "Tavolo 1", points: 85, position: 1, medal: "🥇" },
      { id: 2, name: "Tavolo VIP", points: 72, position: 2, medal: "🥈" },
      { id: 3, name: "Tavolo 3", points: 65, position: 3, medal: "🥉" },
      { id: 4, name: "Tavolo Famiglia", points: 45, position: 4 },
      { id: 5, name: "Tavolo 5", points: 32, position: 5 }
    ]
  });
});

app.get('/api/tables/qr/:qrCode', (req, res) => {
  const { qrCode } = req.params;
  
  const mockTable = {
    id: parseInt(qrCode.replace('TABLE_', '')),
    name: `Tavolo ${qrCode.replace('TABLE_', '')}`,
    points: Math.floor(Math.random() * 100),
    qrCode: qrCode,
    position: Math.floor(Math.random() * 10) + 1
  };
  
  res.json({
    success: true,
    data: mockTable
  });
});

app.post('/api/points/add', (req, res) => {
  const { qrCode, points } = req.body;
  
  res.json({
    success: true,
    message: `${points} punti aggiunti con successo`,
    data: {
      table: {
        qrCode: qrCode,
        points: parseInt(points),
        newTotal: Math.floor(Math.random() * 100) + parseInt(points)
      }
    }
  });
});

app.put('/api/tables/:id/name', (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Nome tavolo aggiornato con successo',
    data: {
      id: id,
      name: name
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trovato'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Errore interno del server'
  });
});

// Avvio server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 QR Tavoli API ready!`);
});

// Gestione errori
process.on('unhandledRejection', (err) => {
  console.log('❌ Unhandled Promise Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.log('❌ Uncaught Exception:', err.message);
});

