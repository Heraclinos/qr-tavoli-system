
// Test azioni sui punti, transazioni, errori, statistics
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Table = require('../src/models/Table');
const PointTransaction = require('../src/models/PointTransaction');

describe('Points Endpoints', () => {
  let cashierToken, adminUser, cashierUser, table;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/qr-tavoli-test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    // Pulisci database
    await User.deleteMany({});
    await Table.deleteMany({});
    await PointTransaction.deleteMany({});

    // Crea utenti
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    cashierUser = await User.create({
      username: 'cashier',
      email: 'cashier@test.com',
      password: 'cashier123',
      firstName: 'Cashier',
      lastName: 'User',
      role: 'cashier'
    });

    // Crea tavolo
    table = await Table.create({
      tableNumber: 1,
      name: 'Test Table',
      points: 0,
      createdBy: adminUser._id
    });

    cashierToken = cashierUser.getSignedJwtToken();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/points/add', () => {
    test('Should add points to table via QR code', async () => {
      const pointsData = {
        qrCode: table.qrCode,
        points: 10,
        description: 'Test points'
      };

      const response = await request(app)
        .post('/api/points/add')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(pointsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.table.points).toBe(10);

      // Verifica che il tavolo sia stato aggiornato
      const updatedTable = await Table.findById(table._id);
      expect(updatedTable.points).toBe(10);
    });

    test('Should not add points without authentication', async () => {
      const pointsData = {
        qrCode: table.qrCode,
        points: 10
      };

      const response = await request(app)
        .post('/api/points/add')
        .send(pointsData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Should not add invalid points amount', async () => {
      const pointsData = {
        qrCode: table.qrCode,
        points: -5 // Punti negativi
      };

      const response = await request(app)
        .post('/api/points/add')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(pointsData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/points/transactions', () => {
    test('Should get transactions list', async () => {
      // Crea alcune transazioni
      await PointTransaction.create([
        {
          table: table._id,
          assignedBy: cashierUser._id,
          points: 10,
          type: 'EARNED'
        },
        {
          table: table._id,
          assignedBy: cashierUser._id,
          points: 5,
          type: 'EARNED'
        }
      ]);

      const response = await request(app)
        .get('/api/points/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });
});
