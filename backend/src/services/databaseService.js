// backend/src/services/databaseService.js


const mysql = require('mysql2/promise');
require('dotenv').config();

function buildDbConfigFromEnv() {
  // Suporte a DSN: MYSQL_URL/DATABASE_URL -> mysql://user:pass@host:port/db?ssl=true
  const dsn = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const sslFlag = (process.env.DB_SSL || '').toLowerCase() === 'true';
  if (dsn) {
    try {
      const u = new URL(dsn);
      const host = u.hostname;
      const port = Number(u.port || 3306);
      const user = decodeURIComponent(u.username || '');
      const password = decodeURIComponent(u.password || '');
      const database = (u.pathname || '/sistema_financeiro').replace(/^\//, '');
      const sslParam = (u.searchParams.get('ssl') || '').toLowerCase() === 'true';
      const useSsl = sslFlag || sslParam;
      const cfg = { host, port, user, password, database };
      if (useSsl) {
        cfg.ssl = { rejectUnauthorized: false };
      }
      return cfg;
    } catch (e) {
      console.warn('Falha ao interpretar DSN MYSQL_URL/DATABASE_URL, caindo para variáveis discretas:', e.message);
    }
  }
  // Variáveis discretas (compatível com Docker Compose local)
  const cfg = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'sistema_financeiro',
    port: Number(process.env.DB_PORT || 3306)
  };
  if (sslFlag) {
    cfg.ssl = { rejectUnauthorized: false };
  }
  return cfg;
}

const dbConfig = buildDbConfigFromEnv();

class DatabaseService {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (!this.connection) {
      // Log de diagnóstico para confirmar alvo da conexão
      const safeCfg = { ...dbConfig };
      if (safeCfg.password) safeCfg.password = '***';
      console.log('Conectando ao MySQL com config:', safeCfg);
      this.connection = await mysql.createConnection(dbConfig);
      console.log('Conexão MySQL estabelecida');
    }
    return this.connection;
  }

  // Consulta se fornecedor existe pelo CNPJ
  async consultarFornecedor(cnpj) {
    const conn = await this.connect();
    try {
      const [rows] = await conn.execute(
        `SELECT idPessoas, razaosocial, fantasia, documento, status 
         FROM Pessoas 
         WHERE documento = ? AND tipo = "CLIENTE-FORNECEDOR"`,
        [cnpj]
      );
      
      if (rows.length > 0) {
        return { 
          existe: true, 
          id: rows[0].idPessoas, 
          dados: rows[0] 
        };
      }
      
      return { existe: false };
    } catch (error) {
      console.error('Erro ao consultar fornecedor:', error);
      throw error;
    }
  }

  // Consulta se faturado existe pelo CPF
  async consultarFaturado(cpf) {
    const conn = await this.connect();
    try {
      const [rows] = await conn.execute(
        `SELECT idPessoas, razaosocial, documento, status 
         FROM Pessoas 
         WHERE documento = ? AND tipo = "FATURADO"`,
        [cpf]
      );
      
      if (rows.length > 0) {
        return { 
          existe: true, 
          id: rows[0].idPessoas, 
          dados: rows[0] 
        };
      }
      
      return { existe: false };
    } catch (error) {
      console.error('Erro ao consultar faturado:', error);
      throw error;
    }
  }

  // Consulta se classificação de despesa existe pela descrição
  async consultarClassificacaoDespesa(descricao) {
    const conn = await this.connect();
    try {
      const [rows] = await conn.execute(
        `SELECT idClassificacao, descricao, tipo, status 
         FROM Classificacao 
         WHERE descricao = ? AND tipo = "DESPESA"`,
        [descricao]
      );
      
      if (rows.length > 0) {
        return { 
          existe: true, 
          id: rows[0].idClassificacao, 
          dados: rows[0] 
        };
      }
      
      return { existe: false };
    } catch (error) {
      console.error('Erro ao consultar classificação:', error);
      throw error;
    }
  }

  // Criar novo fornecedor
  async criarFornecedor(fornecedorData) {
    const conn = await this.connect();
    try {
      const [result] = await conn.execute(
        `INSERT INTO Pessoas (tipo, razaosocial, fantasia, documento, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          'CLIENTE-FORNECEDOR', 
          fornecedorData.razaoSocial, 
          fornecedorData.fantasia || fornecedorData.razaoSocial,
          fornecedorData.cnpj, 
          'ATIVO'
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      throw error;
    }
  }

  // Criar novo faturado
  async criarFaturado(faturadoData) {
    const conn = await this.connect();
    try {
      const [result] = await conn.execute(
        `INSERT INTO Pessoas (tipo, razaosocial, documento, status) 
         VALUES (?, ?, ?, ?)`,
        [
          'FATURADO', 
          faturadoData.nomeCompleto, 
          faturadoData.cpf, 
          'ATIVO'
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Erro ao criar faturado:', error);
      throw error;
    }
  }

  // Criar nova classificação de despesa
  async criarClassificacaoDespesa(classificacaoData) {
    const conn = await this.connect();
    try {
      const [result] = await conn.execute(
        `INSERT INTO Classificacao (tipo, descricao, status) 
         VALUES (?, ?, ?)`,
        [
          'DESPESA', 
          classificacaoData.descricao, 
          'ATIVO'
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Erro ao criar classificação:', error);
      throw error;
    }
  }

  // Criar movimento de contas
  async criarMovimentoContas(movimentoData) {
    const conn = await this.connect();
    try {
      const [result] = await conn.execute(
        `INSERT INTO MovimentoContas 
         (tipo, numeronotafiscal, dataemissao, descricao, status, valortotal, Pessoas_idfornecedorCliente, Pessoas_idFaturado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movimentoData.tipo,
          movimentoData.numeroNotaFiscal,
          movimentoData.dataEmissao,
          movimentoData.descricao,
          'PENDENTE',
          movimentoData.valorTotal,
          movimentoData.idFornecedor,
          movimentoData.idFaturado
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Erro ao criar movimento:', error);
      throw error;
    }
  }

  // Criar parcelas
  async criarParcelas(idMovimentoContas, parcelas) {
    const conn = await this.connect();
    try {
      for (const parcela of parcelas) {
        await conn.execute(
          `INSERT INTO ParcelasContas 
           (Identificacao, datavencimento, valorparcela, valorpago, valorsaldo, statusparcela, MovimentoContas_idMovimentoContas) 
           VALUES (?, ?, ?, 0, ?, 'PENDENTE', ?)`,
          [
            `Parcela ${parcela.numero}`,
            parcela.dataVencimento,
            parcela.valor,
            parcela.valor,
            idMovimentoContas
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao criar parcelas:', error);
      throw error;
    }
  }

  // Vincular classificações ao movimento
  async vincularClassificacoes(idMovimentoContas, idsClassificacoes) {
    const conn = await this.connect();
    try {
      for (const idClassificacao of idsClassificacoes) {
        await conn.execute(
          `INSERT INTO MovimentoContas_has_Classificacao 
           (MovimentoContas_idMovimentoContas, Classificacao_idClassificacao) 
           VALUES (?, ?)`,
          [idMovimentoContas, idClassificacao]
        );
      }
    } catch (error) {
      console.error('Erro ao vincular classificações:', error);
      throw error;
    }
  }

  // ===== Pessoas =====
  async listarPessoas({ tipo, status = 'ATIVO', q }) {
    const conn = await this.connect();
    const where = [];
    const params = [];
    if (tipo) { where.push('tipo = ?'); params.push(tipo); }
    if (status) { where.push('status = ?'); params.push(status); }
    if (q) { where.push('(razaosocial LIKE ? OR fantasia LIKE ? OR documento LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    const sql = `SELECT idPessoas, tipo, razaosocial, fantasia, documento, status FROM Pessoas` + (where.length ? ` WHERE ${where.join(' AND ')}` : '');
    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async criarPessoa({ tipo, razaosocial, fantasia, documento }) {
    const conn = await this.connect();
    const [result] = await conn.execute(
      `INSERT INTO Pessoas (tipo, razaosocial, fantasia, documento, status) VALUES (?, ?, ?, ?, 'ATIVO')`,
      [tipo, razaosocial, fantasia || razaosocial, documento]
    );
    return result.insertId;
  }

  async atualizarPessoa(id, { razaosocial, fantasia, documento }) {
    const conn = await this.connect();
    const [result] = await conn.execute(
      `UPDATE Pessoas SET razaosocial = ?, fantasia = ?, documento = ? WHERE idPessoas = ?`,
      [razaosocial, fantasia || razaosocial, documento, id]
    );
    return result.affectedRows > 0;
  }

  async inativarPessoa(id) {
    const conn = await this.connect();
    const [result] = await conn.execute(
      `UPDATE Pessoas SET status = 'INATIVO' WHERE idPessoas = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  // ===== Classificacao =====
  async listarClassificacao({ tipo, status = 'ATIVO', q }) {
    const conn = await this.connect();
    const where = [];
    const params = [];
    if (tipo) { where.push('tipo = ?'); params.push(tipo); }
    if (status) { where.push('status = ?'); params.push(status); }
    if (q) { where.push('(descricao LIKE ?)'); params.push(`%${q}%`); }
    const sql = `SELECT idClassificacao, tipo, descricao, status FROM Classificacao` + (where.length ? ` WHERE ${where.join(' AND ')}` : '');
    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async criarClassificacao({ tipo, descricao }) {
    const conn = await this.connect();
    const [result] = await conn.execute(
      `INSERT INTO Classificacao (tipo, descricao, status) VALUES (?, ?, 'ATIVO')`,
      [tipo, descricao]
    );
    return result.insertId;
  }

  async atualizarClassificacao(id, { descricao }) {
    const conn = await this.connect();
    const [result] = await conn.execute(
      `UPDATE Classificacao SET descricao = ? WHERE idClassificacao = ?`,
      [descricao, id]
    );
    return result.affectedRows > 0;
  }

  async inativarClassificacao(id) {
    const conn = await this.connect();
    const [result] = await conn.execute(
      `UPDATE Classificacao SET status = 'INATIVO' WHERE idClassificacao = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  // ===== MovimentoContas (Contas) =====
  async listarMovimentos({ status = 'ATIVO', q }) {
    const conn = await this.connect();
    const where = [];
    const params = [];
    if (status) { where.push('status = ?'); params.push(status); }
    if (q) { where.push('(descricao LIKE ? OR numeronotafiscal LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    const sql = `SELECT idMovimentoContas, tipo, numeronotafiscal, dataemissao, descricao, status, valortotal FROM MovimentoContas` + (where.length ? ` WHERE ${where.join(' AND ')}` : '');
    const [rows] = await conn.execute(sql, params);
    return rows;
  }

  async atualizarMovimento(id, { tipo, numeronotafiscal, dataemissao, descricao, valortotal }) {
    const conn = await this.connect();
    const [result] = await conn.execute(
      `UPDATE MovimentoContas SET tipo = ?, numeronotafiscal = ?, dataemissao = ?, descricao = ?, valortotal = ? WHERE idMovimentoContas = ?`,
      [tipo, numeronotafiscal, dataemissao, descricao, valortotal, id]
    );
    return result.affectedRows > 0;
  }

  async inativarMovimento(id) {
    const conn = await this.connect();
    const [result] = await conn.execute(
      `UPDATE MovimentoContas SET status = 'INATIVO' WHERE idMovimentoContas = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new DatabaseService();