// backend/src/services/databaseService.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'sistema_financeiro',
  port: process.env.DB_PORT || 3306
};

class DatabaseService {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (!this.connection) {
      this.connection = await mysql.createConnection(dbConfig);
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
}

module.exports = new DatabaseService();