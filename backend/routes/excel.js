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
    
    // PARSE EXCEL SUBITO
    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    const fileId = Date.now().toString();
    
    // SALVA ANCHE I DATI PARSATI
    fileStore.set(fileId, {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      uploadTime: new Date(),
      data: data,  // AGGIUNGI QUESTO
      columns: data.length > 0 ? Object.keys(data[0]) : []  // AGGIUNGI QUESTO
    });
    
    res.json({ 
      success: true, 
      fileId: fileId,
      filename: req.file.originalname,
      records: data.length,  // AGGIUNGI QUESTO
      columns: data.length > 0 ? Object.keys(data[0]) : []  // AGGIUNGI QUESTO
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analizza file Excel
router.post('/analyze', async (req, res) => {
  try {
    const { fileId, query } = req.body;
    
    if (!fileId || !fileStore.has(fileId)) {
      return res.status(400).json({ error: 'File non trovato' });
    }
    
    const file = fileStore.get(fileId);
    
    // LOG per debug
    console.log('Analyzing file:', file.originalName);
    console.log('Data rows:', file.data?.length || 0);
    
    res.json({
      success: true,
      filename: file.originalName,
      records: file.data?.length || 0,
      columns: file.columns || [],
      preview: file.data?.slice(0, 5) || [],
      aiResponse: `Analisi di ${file.data?.length || 0} record completata`  // PLACEHOLDER
    });
  } catch (error) {
    console.error('Analyze error:', error);
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
