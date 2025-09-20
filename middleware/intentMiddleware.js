const IntentAnalyzer = require('../services/intentAnalyzer');

const intentAnalyzer = new IntentAnalyzer();

const intentMiddleware = async (req, res, next) => {
  try {
    const { message, context = {} } = req.body;
    
    if (!message) {
      return next();
    }

    // Analizza intent
    const intentResult = intentAnalyzer.analyze(message, context);
    
    // Aggiungi risultato alla request
    req.intentAnalysis = intentResult;
    
    // Log per debug
    console.log('Intent Analysis:', {
      message: message.substring(0, 50),
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      requiresConfirmation: intentResult.requiresConfirmation
    });

    // Se confidence bassa e non è chat generale, rispondi con richiesta conferma
    if (intentResult.requiresConfirmation) {
      return res.json({
        type: 'confirmation_required',
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        message: `Non sono sicuro di aver capito. Vuoi ${getIntentDescription(intentResult.intent)}?`,
        original_message: message
      });
    }

    // Arricchisci il messaggio per OpenRouter
    if (intentResult.intent !== 'GENERAL_CHAT') {
      req.body.enrichedMessage = `[INTENT: ${intentResult.intent}] ${message}`;
      req.body.intentContext = intentResult;
    }

    next();
  } catch (error) {
    console.error('Intent middleware error:', error);
    next(); // Continua anche se c'è errore
  }
};

function getIntentDescription(intent) {
  const descriptions = {
    SEND_EMAIL: 'inviare delle email',
    ANALYZE_EXCEL: 'analizzare i dati Excel',
    CREATE_EXCEL: 'creare un nuovo file Excel',
    PROCESS_DOCUMENT: 'processare un documento',
    GENERAL_CHAT: 'avere una conversazione'
  };
  return descriptions[intent] || 'procedere con questa azione';
}

module.exports = intentMiddleware;
