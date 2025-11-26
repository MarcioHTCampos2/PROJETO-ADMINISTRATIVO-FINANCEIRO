const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabaseIfNeeded() {
  if (process.env.DB_AUTO_INIT !== 'true') return;

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'password';
  const port = Number(process.env.DB_PORT || 3306);
  const database = process.env.DB_NAME || 'sistema_financeiro';

  const sqlPath = path.resolve(__dirname, '../../init.sql');
  if (!fs.existsSync(sqlPath)) {
    console.warn('init.sql não encontrado em', sqlPath);
    return;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  if (!sql || sql.trim().length === 0) {
    console.warn('init.sql está vazio, nada a inicializar');
    return;
  }

  let conn = null;
  try {
    // Conecta sem banco para garantir criação do database
    conn = await mysql.createConnection({ host, user, password, port, multipleStatements: true });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await conn.query(`USE \`${database}\``);
    await conn.query(sql);
    console.log('Banco inicializado com init.sql');
  } catch (err) {
    console.error('Falha ao inicializar DB:', err);
  } finally {
    if (conn) await conn.end();
  }
}

module.exports = { initDatabaseIfNeeded };