// Configurazione globale testing, pre/post test DB, variabili ambiente
const mongoose = require('mongoose');

// Configurazione timeout per tutti i test
jest.setTimeout(10000);

// Setup globale prima di tutti i test
beforeAll(async () => {
  // Assicurati che sia impostato l'environment di test
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
});

// Cleanup dopo tutti i test
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
