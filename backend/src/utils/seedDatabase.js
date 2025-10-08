
// Popola il database con dati di esempio: utenti, tavoli e transazioni
const mongoose = require('mongoose');
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

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin user: admin@restaurant.com (password: admin123)`);
    console.log(`   - Cashier user: cassiere@restaurant.com (password: cassiere123)`);
    console.log(`   - Tables: 10 tables created with random points`);
    console.log(`   - Transactions: 20 sample transactions created`);
    console.log('\n🔧 You can now start the server with: npm run dev');

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

module.exports = { seedData };
