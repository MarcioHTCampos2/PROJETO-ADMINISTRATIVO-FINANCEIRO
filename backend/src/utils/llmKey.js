const readline = require('readline');

let LLM_KEY_CACHE = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || null;

async function ensureLLMKey() {
  if (LLM_KEY_CACHE) return LLM_KEY_CACHE;

  const isInteractive = process.stdin.isTTY && process.env.NODE_ENV !== 'production';
  if (!isInteractive) {
    throw new Error('LLM_API_KEY ausente. Defina a variável de ambiente no servidor.');
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve => rl.question('Informe sua LLM API Key: ', ans => resolve(ans.trim())));
  rl.close();
  if (!answer) throw new Error('LLM API Key não informada.');
  LLM_KEY_CACHE = answer;
  return LLM_KEY_CACHE;
}

function setLLMKey(key) {
  if (!key || typeof key !== 'string') {
    throw new Error('Chave LLM inválida.');
  }
  LLM_KEY_CACHE = key.trim();
}

function hasLLMKey() {
  return !!LLM_KEY_CACHE;
}

module.exports = { ensureLLMKey, setLLMKey, hasLLMKey };