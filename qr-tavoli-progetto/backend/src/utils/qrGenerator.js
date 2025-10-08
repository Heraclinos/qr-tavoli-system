
// Genera QR code per i tavoli (PNG/DataURL/SVG), funzione bulk QR per stampa/carte
const QRCode = require('qrcode');
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
};
