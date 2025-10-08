# Creo src/config/database.js per la connessione MongoDB

database_js = """const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
    
    // Setup per development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Event listeners per la connessione
mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

module.exports = connectDB;"""

# Creo src/config/config.js per le configurazioni generali

config_js = """module.exports = {
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
};"""

os.makedirs('src/config', exist_ok=True)

with open('src/config/database.js', 'w', encoding='utf-8') as f:
    f.write(database_js)

with open('src/config/config.js', 'w', encoding='utf-8') as f:
    f.write(config_js)

# Creo il file .env.example

env_example = """# Configurazioni server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/qr-tavoli

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=24h

# Frontend URL per CORS
FRONTEND_URL=http://localhost:3000

# Altre configurazioni
MAX_POINTS_PER_TRANSACTION=100
DEFAULT_RESTAURANT_NAME=Il Mio Ristorante"""

with open('.env.example', 'w', encoding='utf-8') as f:
    f.write(env_example)

# Creo .gitignore

gitignore = """# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Build directories
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Testing
test-results/
.jest-cache/"""

with open('.gitignore', 'w', encoding='utf-8') as f:
    f.write(gitignore)

print("✅ Creato src/config/database.js")
print("✅ Creato src/config/config.js") 
print("✅ Creato .env.example")
print("✅ Creato .gitignore")
print("🔧 Configurazioni database e environment pronte")