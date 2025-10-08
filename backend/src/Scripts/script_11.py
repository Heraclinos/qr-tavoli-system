# Creo un archivio ZIP con tutta la struttura del backend

import zipfile
import os

# Lista tutti i file creati
all_files = [
    'package.json',
    'server.js',
    '.env.example',
    '.gitignore',
    'jest.config.js',
    'README.md',
    'src/app.js',
    'src/config/database.js',
    'src/config/config.js',
    'src/controllers/authController.js',
    'src/controllers/tableController.js',
    'src/controllers/pointsController.js',
    'src/middleware/auth.js',
    'src/middleware/roleCheck.js',
    'src/middleware/validation.js',
    'src/models/Table.js',
    'src/models/User.js',
    'src/models/PointTransaction.js',
    'src/routes/auth.js',
    'src/routes/tables.js',
    'src/routes/points.js',
    'src/utils/qrGenerator.js',
    'src/utils/helpers.js',
    'src/utils/seedDatabase.js',
    'tests/setup.js',
    'tests/auth.test.js',
    'tests/tables.test.js',
    'tests/points.test.js'
]

# Crea l'archivio ZIP
zip_filename = 'qr-tavoli-backend.zip'

with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for file_path in all_files:
        if os.path.exists(file_path):
            # Aggiungi il file mantenendo la struttura delle cartelle
            zipf.write(file_path, f'qr-tavoli-backend/{file_path}')
            print(f"✅ Aggiunto: {file_path}")
        else:
            print(f"⚠️  File non trovato: {file_path}")

print(f"\n🎉 Archivio creato: {zip_filename}")
print(f"📦 Dimensione: {os.path.getsize(zip_filename) / 1024:.1f} KB")

# Verifica contenuto ZIP
with zipfile.ZipFile(zip_filename, 'r') as zipf:
    file_list = zipf.namelist()
    print(f"\n📋 Contenuto archivio ({len(file_list)} files):")
    for file in sorted(file_list):
        print(f"   {file}")

print(f"\n💾 Il progetto backend completo è pronto per il download!")
print(f"🔽 Scarica: {zip_filename}")
print("\n📖 ISTRUZIONI:")
print("1. Estrai l'archivio")
print("2. cd qr-tavoli-backend")
print("3. npm install")
print("4. Configura .env (copia da .env.example)")
print("5. npm run seed")
print("6. npm run dev")