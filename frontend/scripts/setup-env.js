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
  console.log('Setup de ambiente (frontend) — valores serão salvos em .env.local');
  const backendUrl = await ask('REACT_APP_BACKEND_URL (ex: https://seu-backend.onrender.com): ');
  const envLines = `REACT_APP_BACKEND_URL=${backendUrl}\n`;
  const envPath = path.resolve(__dirname, '..', '.env.local');
  fs.writeFileSync(envPath, envLines, { encoding: 'utf8' });
  console.log(`\nArquivo .env.local criado em: ${envPath}`);
  console.log('Atenção: .env.local está listado no .gitignore e não será versionado.');
  rl.close();
}

main().catch(err => {
  console.error('Erro no setup:', err);
  rl.close();
  process.exit(1);
});