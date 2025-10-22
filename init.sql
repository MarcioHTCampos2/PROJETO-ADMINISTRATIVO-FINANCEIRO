-- init.sql
-- Script de inicialização do banco de dados para o Sistema de Processamento de Notas Fiscais

CREATE DATABASE IF NOT EXISTS sistema_financeiro;
USE sistema_financeiro;

-- Tabela Pessoas (Fornecedores, Clientes, Faturados)
CREATE TABLE IF NOT EXISTS Pessoas (
    idPessoas INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(45) NOT NULL,
    razaosocial VARCHAR(150) NOT NULL,
    fantasia VARCHAR(150),
    documento VARCHAR(45) NOT NULL,
    status VARCHAR(45) DEFAULT 'ATIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_documento_tipo (documento, tipo)
);

-- Tabela Classificacao (Despesas e Receitas)
CREATE TABLE IF NOT EXISTS Classificacao (
    idClassificacao INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(45) NOT NULL,
    descricao VARCHAR(150) NOT NULL,
    status VARCHAR(45) DEFAULT 'ATIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_descricao_tipo (descricao, tipo)
);

-- Tabela MovimentoContas (Contas a Pagar/Receber)
CREATE TABLE IF NOT EXISTS MovimentoContas (
    idMovimentoContas INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(45) NOT NULL,
    numeronotafiscal VARCHAR(45),
    dataemissao DATE,
    descricao VARCHAR(300),
    status VARCHAR(45) DEFAULT 'PENDENTE',
    valortotal DECIMAL(15,2) DEFAULT 0.00,
    Pessoas_idfornecedorCliente INT,
    Pessoas_idFaturado INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Pessoas_idfornecedorCliente) REFERENCES Pessoas(idPessoas),
    FOREIGN KEY (Pessoas_idFaturado) REFERENCES Pessoas(idPessoas)
);

-- Tabela ParcelasContas
CREATE TABLE IF NOT EXISTS ParcelasContas (
    idParcelasContas INT AUTO_INCREMENT PRIMARY KEY,
    Identificacao VARCHAR(45),
    datavencimento DATE,
    valorparcela DECIMAL(15,2) DEFAULT 0.00,
    valorpago DECIMAL(15,2) DEFAULT 0.00,
    valorsaldo DECIMAL(15,2) DEFAULT 0.00,
    statusparcela VARCHAR(45) DEFAULT 'PENDENTE',
    MovimentoContas_idMovimentoContas INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (MovimentoContas_idMovimentoContas) REFERENCES MovimentoContas(idMovimentoContas)
);

-- Tabela de associação MovimentoContas_has_Classificacao (Relação N:N)
CREATE TABLE IF NOT EXISTS MovimentoContas_has_Classificacao (
    MovimentoContas_idMovimentoContas INT,
    Classificacao_idClassificacao INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (MovimentoContas_idMovimentoContas, Classificacao_idClassificacao),
    FOREIGN KEY (MovimentoContas_idMovimentoContas) REFERENCES MovimentoContas(idMovimentoContas),
    FOREIGN KEY (Classificacao_idClassificacao) REFERENCES Classificacao(idClassificacao)
);

-- Inserir classificações de despesas padrão
INSERT IGNORE INTO Classificacao (tipo, descricao) VALUES
('DESPESA', 'INSUMOS AGRÍCOLAS'),
('DESPESA', 'MANUTENÇÃO E OPERAÇÃO'),
('DESPESA', 'RECURSOS HUMANOS'),
('DESPESA', 'SERVIÇOS OPERACIONAIS'),
('DESPESA', 'INFRAESTRUTURA E UTILIDADES'),
('DESPESA', 'ADMINISTRATIVAS'),
('DESPESA', 'SEGUROS E PROTEÇÃO'),
('DESPESA', 'IMPOSTOS E TAXAS'),
('DESPESA', 'INVESTIMENTOS'),
('DESPESA', 'OUTROS');

-- Inserir alguns dados de exemplo para teste
INSERT IGNORE INTO Pessoas (tipo, razaosocial, documento) VALUES
('FATURADO', 'BELTRANO DA SILVA', '999.999.999-99'),
('CLIENTE-FORNECEDOR', 'FORNECEDOR EXEMPLO LTDA', '12.345.678/0001-90');

-- Criar índices para melhor performance
CREATE INDEX idx_pessoas_tipo ON Pessoas(tipo);
CREATE INDEX idx_pessoas_documento ON Pessoas(documento);
CREATE INDEX idx_pessoas_status ON Pessoas(status);
CREATE INDEX idx_classificacao_tipo ON Classificacao(tipo);
CREATE INDEX idx_movimento_tipo ON MovimentoContas(tipo);
CREATE INDEX idx_movimento_status ON MovimentoContas(status);
CREATE INDEX idx_parcelas_vencimento ON ParcelasContas(datavencimento);
CREATE INDEX idx_parcelas_status ON ParcelasContas(statusparcela);

-- Visualizar as tabelas criadas
SHOW TABLES;

-- Visualizar a estrutura das tabelas
DESCRIBE Pessoas;
DESCRIBE Classificacao;
DESCRIBE MovimentoContas;
DESCRIBE ParcelasContas;
DESCRIBE MovimentoContas_has_Classificacao;