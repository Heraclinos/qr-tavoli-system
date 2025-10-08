# Creo gli utility files

# src/utils/qrGenerator.js
qr_generator = """const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

// Genera QR code come immagine
exports.generateQRImage = async (data, outputPath, options = {}) => {
  try {
    const defaultOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',  
        light: '#FFFFFF' 
      }
    };

    const qrOptions = { ...defaultOptions, ...options };
    
    await QRCode.toFile(outputPath, data, qrOptions);
    
    return {
      success: true,
      path: outputPath,
      data
    };

  } catch (error) {
    console.error('QR Generation Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Genera QR code come string SVG
exports.generateQRSVG = async (data, options = {}) => {
  try {
    const defaultOptions = {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    const qrOptions = { ...defaultOptions, ...options };
    const svgString = await QRCode.toString(data, qrOptions);
    
    return {
      success: true,
      svg: svgString,
      data
    };

  } catch (error) {
    console.error('QR SVG Generation Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Genera QR code come Data URL (base64)
exports.generateQRDataURL = async (data, options = {}) => {
  try {
    const defaultOptions = {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    const qrOptions = { ...defaultOptions, ...options };
    const dataURL = await QRCode.toDataURL(data, qrOptions);
    
    return {
      success: true,
      dataURL,
      data
    };

  } catch (error) {
    console.error('QR DataURL Generation Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Genera QR codes per tutti i tavoli
exports.generateTableQRCodes = async (tables, outputDir = './qr-codes') => {
  try {
    // Crea directory se non esiste
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    const results = [];

    for (const table of tables) {
      const qrData = table.qrCode || `TABLE_${table.tableNumber}`;
      const fileName = `table-${table.tableNumber}.png`;
      const outputPath = path.join(outputDir, fileName);

      const result = await exports.generateQRImage(qrData, outputPath);
      
      results.push({
        tableNumber: table.tableNumber,
        tableName: table.name,
        qrCode: qrData,
        fileName,
        outputPath,
        success: result.success
      });
    }

    return {
      success: true,
      results,
      totalGenerated: results.filter(r => r.success).length,
      outputDirectory: outputDir
    };

  } catch (error) {
    console.error('Bulk QR Generation Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Genera QR code per frontend (ritorna data URL)
exports.generateTableQRForFrontend = async (tableNumber) => {
  try {
    const qrData = `TABLE_${tableNumber}`;
    const result = await exports.generateQRDataURL(qrData);
    
    if (result.success) {
      return {
        success: true,
        tableNumber,
        qrCode: qrData,
        dataURL: result.dataURL
      };
    }
    
    return result;

  } catch (error) {
    console.error('Frontend QR Generation Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};"""

# src/utils/helpers.js
helpers = """const crypto = require('crypto');

// Genera ID univoco
exports.generateUniqueId = (length = 8) => {
  return crypto.randomBytes(length).toString('hex').toUpperCase();
};

// Formatta data italiana
exports.formatDateIT = (date) => {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome'
  };
  
  return new Intl.DateTimeFormat('it-IT', options).format(new Date(date));
};

// Valida codice QR tavolo
exports.validateTableQR = (qrCode) => {
  const qrRegex = /^TABLE_\\d+$/;
  return qrRegex.test(qrCode);
};

// Estrai numero tavolo da QR code
exports.extractTableNumber = (qrCode) => {
  const match = qrCode.match(/^TABLE_(\\d+)$/);
  return match ? parseInt(match[1]) : null;
};

// Genera codice QR per tavolo
exports.generateTableQR = (tableNumber) => {
  return `TABLE_${tableNumber}`;
};

// Calcola posizione in classifica
exports.calculatePosition = (currentPoints, allTables) => {
  const sortedTables = allTables
    .filter(table => table.isActive)
    .sort((a, b) => {
      if (b.points === a.points) {
        return new Date(a.lastPointsUpdate) - new Date(b.lastPointsUpdate);
      }
      return b.points - a.points;
    });

  const position = sortedTables.findIndex(table => 
    table.points === currentPoints
  ) + 1;

  return {
    position,
    total: sortedTables.length,
    medal: position <= 3 ? ['🥇', '🥈', '🥉'][position - 1] : null
  };
};

// Sanitizza nome tavolo
exports.sanitizeTableName = (name) => {
  if (!name || typeof name !== 'string') {
    return null;
  }
  
  return name
    .trim()
    .replace(/[<>\"'&]/g, '') // Rimuovi caratteri pericolosi
    .substring(0, 50); // Limita lunghezza
};

// Valida punti
exports.validatePoints = (points, min = 1, max = 100) => {
  const numPoints = parseInt(points);
  
  if (isNaN(numPoints)) {
    return { valid: false, message: 'I punti devono essere un numero' };
  }
  
  if (numPoints < min) {
    return { valid: false, message: `I punti devono essere almeno ${min}` };
  }
  
  if (numPoints > max) {
    return { valid: false, message: `I punti non possono superare ${max}` };
  }
  
  return { valid: true, points: numPoints };
};

// Formatta risposta API standard
exports.formatResponse = (success, data = null, message = '', errors = null) => {
  const response = { success };
  
  if (message) response.message = message;
  if (data !== null) response.data = data;
  if (errors) response.errors = errors;
  
  return response;
};

// Pagina risultati
exports.paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

// Calcola statistiche classifica
exports.calculateLeaderboardStats = (tables) => {
  if (!tables || tables.length === 0) {
    return {
      totalTables: 0,
      totalPoints: 0,
      averagePoints: 0,
      topTable: null
    };
  }
  
  const activeTables = tables.filter(table => table.isActive);
  const totalPoints = activeTables.reduce((sum, table) => sum + table.points, 0);
  
  return {
    totalTables: activeTables.length,
    totalPoints,
    averagePoints: Math.round(totalPoints / activeTables.length),
    topTable: activeTables.sort((a, b) => b.points - a.points)[0]
  };
};

// Debounce function per limitare chiamate frequenti
exports.debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Log formattato per development
exports.devLog = (message, data = null, type = 'info') => {
  if (process.env.NODE_ENV === 'development') {
    const colors = {
      info: '\\x1b[36m',    // Cyan
      success: '\\x1b[32m', // Green
      warning: '\\x1b[33m', // Yellow
      error: '\\x1b[31m',   // Red
      reset: '\\x1b[0m'     // Reset
    };
    
    const color = colors[type] || colors.info;
    const timestamp = new Date().toISOString();
    
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
    
    if (data) {
      console.log(data);
    }
  }
};"""

# src/utils/seedDatabase.js
seed_database = """const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Table = require('../models/Table');
const PointTransaction = require('../models/PointTransaction');

// Connessione database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🗄️  MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Pulisci database esistente
    await User.deleteMany({});
    await Table.deleteMany({});
    await PointTransaction.deleteMany({});
    
    console.log('🧹 Cleared existing data');

    // Crea utenti admin e cassiere
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@restaurant.com',
      password: 'admin123',
      firstName: 'Mario',
      lastName: 'Rossi',
      role: 'admin'
    });

    const cashierUser = await User.create({
      username: 'cassiere1',
      email: 'cassiere@restaurant.com',
      password: 'cassiere123',
      firstName: 'Giulia',
      lastName: 'Bianchi',
      role: 'cashier'
    });

    console.log('👥 Created users');

    // Crea tavoli con punti casuali
    const tablePromises = [];
    for (let i = 1; i <= 10; i++) {
      const randomPoints = Math.floor(Math.random() * 80) + 10; // 10-90 punti
      
      tablePromises.push(
        Table.create({
          tableNumber: i,
          name: `Tavolo ${i}`,
          points: randomPoints,
          createdBy: adminUser._id
        })
      );
    }

    const tables = await Promise.all(tablePromises);
    console.log('🪑 Created tables');

    // Crea alcune transazioni di esempio
    const transactionPromises = [];
    
    for (let i = 0; i < 20; i++) {
      const randomTable = tables[Math.floor(Math.random() * tables.length)];
      const randomPoints = Math.floor(Math.random() * 20) + 1;
      const randomUser = Math.random() > 0.5 ? adminUser : cashierUser;
      
      transactionPromises.push(
        PointTransaction.create({
          table: randomTable._id,
          assignedBy: randomUser._id,
          points: randomPoints,
          type: 'EARNED',
          description: `Punti assegnati durante il seed - transazione ${i + 1}`,
          metadata: {
            previousPoints: Math.max(0, randomTable.points - randomPoints),
            newPoints: randomTable.points,
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Ultimi 7 giorni
          }
        })
      );
    }

    await Promise.all(transactionPromises);
    console.log('💰 Created sample transactions');

    console.log('\\n✅ Database seeding completed successfully!');
    console.log('\\n📊 Summary:');
    console.log(`   - Admin user: admin@restaurant.com (password: admin123)`);
    console.log(`   - Cashier user: cassiere@restaurant.com (password: cassiere123)`);
    console.log(`   - Tables: 10 tables created with random points`);
    console.log(`   - Transactions: 20 sample transactions created`);
    console.log('\\n🔧 You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Esegui seed
const runSeed = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

// Esegui se chiamato direttamente
if (require.main === module) {
  runSeed();
}

module.exports = { seedData };"""

# README.md
readme_content = """# 🍽️ QR Tavoli Backend - Sistema Punti Ristorante

Backend API per sistema di punti fedeltà basato su QR code per ristoranti.

## 📋 Caratteristiche

- **Sistema QR Code**: Ogni tavolo ha un QR code univoco per identificazione
- **Gestione Punti**: Cassieri possono assegnare punti, clienti vedono classifica
- **Ruoli Utente**: Admin, Cassiere, Cliente con permessi diversi
- **Autenticazione JWT**: Sistema di login sicuro
- **Database MongoDB**: Persistenza dati con Mongoose
- **Validazione Input**: Controlli di sicurezza su tutti gli endpoint
- **API RESTful**: Endpoint ben strutturati e documentati

## 🚀 Quick Start

### Prerequisiti
- Node.js >= 18.0.0
- MongoDB (locale o MongoDB Atlas)
- npm o yarn

### Installazione

1. **Clona il repository**
   ```bash
   git clone <repo-url>
   cd qr-tavoli-backend
   ```

2. **Installa dipendenze**
   ```bash
   npm install
   ```

3. **Configura environment**
   ```bash
   cp .env.example .env
   # Modifica .env con le tue configurazioni
   ```

4. **Popola database con dati di esempio**
   ```bash
   npm run seed
   ```

5. **Avvia server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

Il server sarà disponibile su `http://localhost:3000`

## 🏗️ Struttura Progetto

```
src/
├── config/          # Configurazioni database e app
├── controllers/     # Logica business
├── middleware/      # Auth, validazione, controlli ruoli
├── models/          # Schema Mongoose
├── routes/          # Definizione endpoint
└── utils/           # Utility e helper functions
```

## 🔐 Autenticazione

L'API usa JWT tokens per l'autenticazione. Include il token nell'header:

```
Authorization: Bearer <your-jwt-token>
```

### Utenti di default (dopo seed)
- **Admin**: `admin@restaurant.com` / `admin123`
- **Cassiere**: `cassiere@restaurant.com` / `cassiere123`

## 📡 Endpoint Principali

### Autenticazione
```
POST /api/auth/register  # Registrazione
POST /api/auth/login     # Login
GET  /api/auth/me        # Profilo utente
```

### Tavoli
```
GET  /api/tables/leaderboard    # Classifica pubblica
GET  /api/tables/qr/:qrCode     # Trova tavolo tramite QR
POST /api/tables                # Crea tavolo (Admin)
PUT  /api/tables/:id/name       # Cambia nome tavolo
```

### Punti
```
POST /api/points/add            # Assegna punti (Cassiere)
POST /api/points/redeem         # Riscatta punti (Cassiere)
GET  /api/points/transactions   # Storico transazioni
GET  /api/points/stats/daily    # Statistiche giornaliere
```

## 🎯 Flusso Applicazione

1. **Cassiere** fa login e scansiona QR code del tavolo cliente
2. **Sistema** identifica il tavolo e mostra punti attuali
3. **Cassiere** assegna punti in base all'acquisto
4. **Cliente** può vedere classifica e cambiare nome tavolo
5. **Sistema** traccia tutte le transazioni per analytics

## 🔧 Configurazione

### Variabili Environment (.env)
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/qr-tavoli
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=24h
FRONTEND_URL=http://localhost:3000
```

### Ruoli Utente
- **Admin**: Gestione completa sistema
- **Cashier**: Assegnazione/riscatto punti
- **Customer**: Visualizzazione classifica, cambio nome tavolo

## 🧪 Testing

```bash
# Esegui test
npm test

# Test con coverage
npm run test:coverage
```

## 🏃‍♂️ Deployment

### Opzioni Hosting Consigliate
1. **Render** (gratuito) - Include database
2. **Railway** - $5 crediti/mese
3. **Heroku** - Piani a pagamento
4. **DigitalOcean** - VPS personalizzato

### Build per produzione
```bash
# Imposta NODE_ENV=production nel .env
npm start
```

## 🛡️ Sicurezza

- Rate limiting (100 req/15min per IP)
- Helmet per headers sicuri
- Validazione input con express-validator
- Hash password con bcrypt
- Sanitizzazione HTML
- Controlli ruoli granulari

## 📊 Monitoring e Logging

- Morgan per logging HTTP requests
- Error handling centralizzato
- Health check endpoint: `GET /health`

## 🤝 Contributing

1. Fork del progetto
2. Crea branch feature (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Apri Pull Request

## 📝 API Documentation

Avvia il server e visita `/api/docs` per documentazione interattiva (da implementare con Swagger).

## ⚡ Performance Tips

- Usa indici MongoDB per query frequenti
- Implementa caching Redis per classifiche
- Ottimizza query con populate selettivo
- Monitora performance con APM tools

## 🐛 Troubleshooting

### Errori Comuni
- **MongoDB Connection**: Verifica MONGODB_URI in .env
- **JWT Token**: Controlla JWT_SECRET e formato token
- **CORS**: Imposta FRONTEND_URL correttamente
- **Validazione**: Controlla formato dati in input

## 📞 Support

Per bug reports e feature requests, apri un issue su GitHub.

---

Sviluppato con ❤️ per ristoranti italiani 🇮🇹"""

# Creo le cartelle e i file
os.makedirs('src/utils', exist_ok=True)

with open('src/utils/qrGenerator.js', 'w', encoding='utf-8') as f:
    f.write(qr_generator)

with open('src/utils/helpers.js', 'w', encoding='utf-8') as f:
    f.write(helpers)

with open('src/utils/seedDatabase.js', 'w', encoding='utf-8') as f:
    f.write(seed_database)

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(readme_content)

print("✅ Creato src/utils/qrGenerator.js")
print("✅ Creato src/utils/helpers.js")
print("✅ Creato src/utils/seedDatabase.js")
print("✅ Creato README.md")
print("🔧 Utility con:")
print("- Generazione QR codes (PNG, SVG, DataURL)")
print("- Helper functions per validazione e formattazione")
print("- Script seed database con dati di esempio")
print("- Documentazione completa del progetto")