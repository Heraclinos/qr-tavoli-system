# Creo il package.json per il progetto

package_json = """{
  "name": "qr-tavoli-backend",
  "version": "1.0.0",
  "description": "Backend API per sistema QR punti tavoli ristorante",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "seed": "node src/utils/seedDatabase.js"
  },
  "keywords": ["restaurant", "qr-code", "loyalty", "points-system", "node.js"],
  "author": "Your Name",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "qrcode": "^1.5.3",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}"""

# Salvo il file
with open('package.json', 'w', encoding='utf-8') as f:
    f.write(package_json)

print("✅ Creato package.json")
print("📦 Dipendenze principali incluse:")
print("- Express.js per il server web")
print("- Mongoose per MongoDB")
print("- JWT per autenticazione")
print("- bcryptjs per hash password")
print("- express-validator per validazione")
print("- qrcode per generazione QR")
print("- cors, helmet per sicurezza")
print("- morgan per logging")
print("- nodemon per development")