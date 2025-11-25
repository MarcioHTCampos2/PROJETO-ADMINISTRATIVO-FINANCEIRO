const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

async function main() {
  console.log('Setup de ambiente (backend) — valores serão salvos em .env');

  const llmKey = await ask('LLM_API_KEY (ex: chave do Gemini/OpenAI): ');
  const frontendUrl = await ask('FRONTEND_URL (ex: https://seu-projeto.vercel.app): ');
  const port = await ask('PORT (default 5000): ');

  console.log('\nConfiguração do banco (use Enter para manter default):');
  const dbHost = await ask('DB_HOST (default mysql): ');
  const dbUser = await ask('DB_USER (default root): ');
  const dbPassword = await ask('DB_PASSWORD (default password): ');
  const dbName = await ask('DB_NAME (default sistema_financeiro): ');
  const dbPort = await ask('DB_PORT (default 3306): ');

  const envLines = [
    `LLM_API_KEY=${llmKey}`,
    `FRONTEND_URL=${frontendUrl}`,
    `PORT=${port || '5000'}`,
    `DB_HOST=${dbHost || 'mysql'}`,
    `DB_USER=${dbUser || 'root'}`,
    `DB_PASSWORD=${dbPassword || 'password'}`,
    `DB_NAME=${dbName || 'sistema_financeiro'}`,
    `DB_PORT=${dbPort || '3306'}`,
  ].join('\n') + '\n';

  const envPath = path.resolve(__dirname, '..', '.env');
  fs.writeFileSync(envPath, envLines, { encoding: 'utf8' });
  console.log(`\nArquivo .env criado em: ${envPath}`);
  console.log('Atenção: .env está listado no .gitignore e não será versionado.');
  rl.close();
}

main().catch(err => {
  console.error('Erro no setup:', err);
  rl.close();
  process.exit(1);
});