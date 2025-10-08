# Creo la struttura del progetto Node.js per il sistema QR punti tavoli

project_structure = """
qr-tavoli-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── config.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── tableController.js
│   │   └── pointsController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── roleCheck.js
│   │   └── validation.js
│   ├── models/
│   │   ├── Table.js
│   │   ├── User.js
│   │   └── PointTransaction.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tables.js
│   │   └── points.js
│   ├── utils/
│   │   ├── qrGenerator.js
│   │   └── helpers.js
│   └── app.js
├── tests/
│   ├── auth.test.js
│   ├── tables.test.js
│   └── points.test.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
"""

print("Struttura del progetto Node.js:")
print(project_structure)