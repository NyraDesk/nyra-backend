const express = require('express');
const router = express.Router();
const IntentAnalyzer = require('../services/intentAnalyzer');

const analyzer = new IntentAnalyzer();

router.post('/test-intent', (req, res) => {
  const { message, context = {} } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }
  
  const result = analyzer.analyze(message, context);
  
  res.json({
    input: message,
    analysis: result,
    timestamp: new Date().toISOString()
  });
});

router.get('/intent-stats', (req, res) => {
  res.json({
    status: 'Intent Analyzer Active',
    version: '1.0.0',
    availableIntents: [
      'SEND_EMAIL',
      'ANALYZE_EXCEL', 
      'CREATE_EXCEL',
      'PROCESS_DOCUMENT',
      'GENERAL_CHAT'
    ]
  });
});

module.exports = router;
