class IntentAnalyzer {
  constructor() {
    this.intents = {
      SEND_EMAIL: {
        patterns: [
          /invia.*email/i,
          /manda.*mail/i,
          /spedisci.*messag/i,
          /email.*client/i,
          /contatta.*tutti/i
        ],
        requiredContext: ['hasEmailAddresses'],
        entities: ['email', 'destinatari', 'cliente'],
        confidence: 0
      },
      ANALYZE_EXCEL: {
        patterns: [
          /analizza.*dat/i,
          /analisi.*excel/i,
          /statistiche/i,
          /report.*dat/i,
          /mostra.*grafic/i
        ],
        requiredContext: ['hasExcelData'],
        entities: ['dati', 'excel', 'analisi', 'grafico'],
        confidence: 0
      },
      CREATE_EXCEL: {
        patterns: [
          /crea.*excel/i,
          /genera.*foglio/i,
          /nuovo.*spreadsheet/i,
          /prepara.*tabella/i
        ],
        requiredContext: [],
        entities: ['excel', 'tabella', 'foglio'],
        confidence: 0
      },
      PROCESS_DOCUMENT: {
        patterns: [
          /leggi.*document/i,
          /carica.*file/i,
          /processa.*pdf/i,
          /estrai.*test/i
        ],
        requiredContext: [],
        entities: ['documento', 'file', 'pdf', 'testo'],
        confidence: 0
      },
      GENERAL_CHAT: {
        patterns: [],
        requiredContext: [],
        entities: [],
        confidence: 0
      }
    };
  }

  analyze(message, context = {}) {
    if (!message || typeof message !== 'string') {
      return {
        intent: 'GENERAL_CHAT',
        confidence: 1.0,
        entities: {},
        suggestedAction: null,
        requiresConfirmation: false
      };
    }

    const messageLower = message.toLowerCase();
    let bestIntent = 'GENERAL_CHAT';
    let highestScore = 0;
    const scores = {};

    // Calcola score per ogni intent
    for (const [intentName, intentConfig] of Object.entries(this.intents)) {
      let score = 0;
      
      // Pattern matching
      for (const pattern of intentConfig.patterns) {
        if (pattern.test(message)) {
          score += 0.4;
        }
      }
      
      // Entity detection
      for (const entity of intentConfig.entities) {
        if (messageLower.includes(entity)) {
          score += 0.2;
        }
      }
      
      // Context checking
      if (intentConfig.requiredContext.length > 0) {
        const hasRequiredContext = intentConfig.requiredContext.some(
          ctx => context[ctx]
        );
        if (hasRequiredContext) {
          score += 0.3;
        } else {
          score *= 0.5; // Penalità se manca contesto richiesto
        }
      }
      
      // Bonus per match esatti
      if (intentName === 'SEND_EMAIL' && messageLower.includes('invia') && messageLower.includes('email')) {
        score += 0.3;
      }
      if (intentName === 'ANALYZE_EXCEL' && messageLower.includes('analizza')) {
        score += 0.2;
      }
      
      scores[intentName] = Math.min(score, 1.0);
      
      if (score > highestScore && intentName !== 'GENERAL_CHAT') {
        highestScore = score;
        bestIntent = intentName;
      }
    }

    // Se nessun intent specifico ha score alto, usa GENERAL_CHAT
    if (highestScore < 0.3) {
      bestIntent = 'GENERAL_CHAT';
      highestScore = 1.0;
    }

    // Determina se serve conferma
    const requiresConfirmation = highestScore > 0 && highestScore < 0.7 && bestIntent !== 'GENERAL_CHAT';

    // Suggerisci azione
    const suggestedActions = {
      SEND_EMAIL: 'prepareEmailBatch',
      ANALYZE_EXCEL: 'analyzeExcelData',
      CREATE_EXCEL: 'createNewExcel',
      PROCESS_DOCUMENT: 'processDocument',
      GENERAL_CHAT: null
    };

    return {
      intent: bestIntent,
      confidence: highestScore,
      entities: this.extractEntities(message, bestIntent),
      suggestedAction: suggestedActions[bestIntent],
      requiresConfirmation,
      scores // Per debug
    };
  }

  extractEntities(message, intent) {
    const entities = {};
    
    if (intent === 'SEND_EMAIL') {
      // Estrai possibili riferimenti a destinatari
      if (message.match(/tutti|everyone|all/i)) {
        entities.recipients = 'all';
      }
      if (message.match(/client/i)) {
        entities.recipientType = 'clients';
      }
    }
    
    if (intent === 'ANALYZE_EXCEL') {
      // Estrai tipo di analisi
      if (message.match(/vend|sales/i)) {
        entities.analysisType = 'sales';
      }
      if (message.match(/statistic/i)) {
        entities.analysisType = 'statistics';
      }
    }
    
    return entities;
  }
}

module.exports = IntentAnalyzer;
