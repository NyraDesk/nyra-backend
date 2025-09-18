const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');

// Storage in memoria temporaneo
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Store per i file (temporaneo in memoria)
const fileStore = new Map();

// Upload file Excel
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }
    
    const fileId = Date.now().toString();
    fileStore.set(fileId, {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      uploadTime: new Date()
    });
    
    res.json({ 
      success: true, 
      fileId: fileId,
      fileName: req.file.originalname 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analizza file Excel
router.post('/analyze', async (req, res) => {
  try {
    const { fileId } = req.body;
    
    if (!fileId || !fileStore.has(fileId)) {
      return res.status(400).json({ error: 'File non trovato' });
    }
    
    const file = fileStore.get(fileId);
    const workbook = xlsx.read(file.buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    res.json({
      success: true,
      sheetName: sheetName,
      rowCount: data.length,
      preview: data.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lista file
router.get('/files', (req, res) => {
  const files = Array.from(fileStore.entries()).map(([id, file]) => ({
    id: id,
    name: file.originalName,
    uploadTime: file.uploadTime
  }));
  
  res.json({ files });
});

module.exports = router;
