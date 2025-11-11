const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const databaseService = require('./databaseService');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const INDEX_PATH = path.join(UPLOADS_DIR, 'rag_index.json');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function saveIndex(index) {
  ensureUploadsDir();
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8');
}

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) return null;
  try {
    const raw = fs.readFileSync(INDEX_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúâêîôûãõç\s_]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedText(text) {
  // Usa o modelo de embeddings do Gemini
  const embeddingModel = genAI.getEmbeddingModel({ model: 'text-embedding-004' });
  const result = await embeddingModel.embedContent(text);
  const embedding = result?.embedding?.values || [];
  return embedding;
}

async function generateAnswer(contextText, question) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const prompt = `Você é um assistente especializado em responder perguntas sobre um banco de dados MySQL.
Use EXCLUSIVAMENTE o contexto fornecido para responder com clareza e objetividade.
Se o contexto não for suficiente, explique o que falta e sugira como obter.

Pergunta:
${question}

Contexto (tabelas, colunas, amostras):
${contextText}

Formato da resposta:
- Explique o raciocínio com base no contexto.
- Se aplicável, proponha consultas SQL exemplificativas.
- Evite inventar dados que não estão no contexto.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function getSchemaDocs() {
  const conn = await databaseService.connect();
  const dbNameQuery = 'SELECT DATABASE() AS db';
  const [dbRow] = await conn.execute(dbNameQuery);
  const dbName = dbRow?.[0]?.db || process.env.DB_NAME || 'sistema_financeiro';

  const [tables] = await conn.execute(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
    [dbName]
  );

  const docs = [];
  for (const t of tables) {
    const tableName = t.TABLE_NAME;
    const [columns] = await conn.execute(
      'SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
      [dbName, tableName]
    );

    // Tenta obter algumas linhas de exemplo
    let sampleRows = [];
    try {
      const [rows] = await conn.execute(`SELECT * FROM \`${tableName}\` LIMIT 3`);
      sampleRows = rows;
    } catch (e) {
      sampleRows = [];
    }

    const colDesc = columns
      .map(c => `- ${c.COLUMN_NAME} (${c.DATA_TYPE}, nullable: ${c.IS_NULLABLE})`)
      .join('\n');

    const sampleText = sampleRows.length > 0
      ? `Amostras (até 3 linhas):\n${JSON.stringify(sampleRows, null, 2)}`
      : 'Sem amostras ou tabela vazia.';

    const text = `Tabela: ${tableName}\nColunas:\n${colDesc}\n${sampleText}`;

    docs.push({
      id: `table:${tableName}`,
      source: tableName,
      text
    });
  }
  return docs;
}

async function buildSchemaIndex() {
  const docs = await getSchemaDocs();
  const indexed = [];
  for (const doc of docs) {
    const embedding = await embedText(doc.text);
    indexed.push({ ...doc, embedding });
  }
  saveIndex({ createdAt: new Date().toISOString(), count: indexed.length, docs: indexed });
  return { count: indexed.length, docsProcessed: docs.map(d => d.source) };
}

async function querySimple(question) {
  // Busca por palavras-chave em tabelas e colunas; monta contexto básico
  const conn = await databaseService.connect();
  const [dbRow] = await conn.execute('SELECT DATABASE() AS db');
  const dbName = dbRow?.[0]?.db || process.env.DB_NAME || 'sistema_financeiro';

  const tokens = tokenize(question);
  const likeClauses = tokens.map(() => '%?%');

  const [tables] = await conn.execute(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
    [dbName]
  );

  const contextParts = [];
  for (const t of tables) {
    const table = t.TABLE_NAME;
    const [columns] = await conn.execute(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [dbName, table]
    );
    const names = [table, ...columns.map(c => c.COLUMN_NAME)].join(' ').toLowerCase();
    const match = tokens.some(tok => names.includes(tok));
    if (match) {
      // inclui descrição da tabela e poucas linhas
      const [colRows] = await conn.execute(
        'SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
        [dbName, table]
      );
      let sample = [];
      try {
        const [rows] = await conn.execute(`SELECT * FROM \`${table}\` LIMIT 2`);
        sample = rows;
      } catch (e) {}
      contextParts.push(
        `Tabela ${table}\nColunas: ${colRows.map(r => `${r.COLUMN_NAME}(${r.DATA_TYPE})`).join(', ')}\nAmostras: ${sample.length > 0 ? JSON.stringify(sample, null, 2) : 'sem amostras'}`
      );
    }
  }

  const contextText = contextParts.join('\n\n');
  const answer = await generateAnswer(contextText, question);
  return { mode: 'simple', answer, contextSize: contextParts.length, context: contextParts };
}

async function queryEmbeddings(question) {
  const index = loadIndex();
  if (!index || !index.docs || index.docs.length === 0) {
    return { mode: 'embeddings', error: 'Índice de embeddings não encontrado. Recrie com /api/rag/index.' };
  }
  const qEmbedding = await embedText(question);
  const scored = index.docs.map(doc => ({
    doc,
    score: cosineSimilarity(qEmbedding, doc.embedding)
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);

  const contextParts = scored.map(s => `Fonte: ${s.doc.source}\n${s.doc.text}\n(score: ${s.score.toFixed(4)})`);
  const contextText = contextParts.join('\n\n');
  const answer = await generateAnswer(contextText, question);
  return { mode: 'embeddings', answer, topK: scored.length, context: contextParts };
}

module.exports = {
  buildSchemaIndex,
  querySimple,
  queryEmbeddings,
};