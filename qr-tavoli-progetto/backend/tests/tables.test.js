
// Test endpoint tavoli, classifica, QR lookup, permessi ruoli
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Table = require('../src/models/Table');

describe('Tables Endpoints', () => {
  let adminToken, cashierToken, adminUser;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/qr-tavoli-test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    // Pulisci database
    await User.deleteMany({});
    await Table.deleteMany({});

    // Crea utenti di test
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    const cashierUser = await User.create({
      username: 'cashier',
      email: 'cashier@test.com',
      password: 'cashier123',
      firstName: 'Cashier',
      lastName: 'User',
      role: 'cashier'
    });

    // Genera token
    adminToken = adminUser.getSignedJwtToken();
    cashierToken = cashierUser.getSignedJwtToken();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/tables/leaderboard', () => {
    test('Should get leaderboard without authentication', async () => {
      // Crea alcuni tavoli
      await Table.create([
        { tableNumber: 1, name: 'Tavolo 1', points: 50, createdBy: adminUser._id },
        { tableNumber: 2, name: 'Tavolo 2', points: 75, createdBy: adminUser._id },
        { tableNumber: 3, name: 'Tavolo 3', points: 25, createdBy: adminUser._id }
      ]);

      const response = await request(app)
        .get('/api/tables/leaderboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].points).toBe(75); // Ordinato per punti decrescenti
    });
  });

  describe('GET /api/tables/qr/:qrCode', () => {
    test('Should find table by valid QR code', async () => {
      const table = await Table.create({
        tableNumber: 1,
        name: 'Tavolo 1',
        points: 50,
        createdBy: adminUser._id
      });

      const response = await request(app)
        .get(`/api/tables/qr/${table.qrCode}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tableNumber).toBe(1);
      expect(response.body.data.position).toBe(1);
    });

    test('Should return 404 for invalid QR code', async () => {
      const response = await request(app)
        .get('/api/tables/qr/INVALID_QR')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tables', () => {
    test('Should create table as admin', async () => {
      const tableData = {
        tableNumber: 1,
        name: 'Test Table'
      };

      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tableData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tableNumber).toBe(1);
      expect(response.body.data.qrCode).toBe('TABLE_1');
    });

    test('Should not create table as cashier', async () => {
      const tableData = {
        tableNumber: 1,
        name: 'Test Table'
      };

      const response = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(tableData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
