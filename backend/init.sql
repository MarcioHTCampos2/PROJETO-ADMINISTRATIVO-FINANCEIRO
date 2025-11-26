-- Schema inicial para MySQL

CREATE TABLE IF NOT EXISTS Pessoas (
  idPessoas INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  razaosocial VARCHAR(255) NOT NULL,
  fantasia VARCHAR(255),
  documento VARCHAR(50),
  status VARCHAR(20) NOT NULL,
  UNIQUE KEY uniq_tipo_documento (tipo, documento)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Classificacao (
  idClassificacao INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  UNIQUE KEY uniq_tipo_descricao (tipo, descricao)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS MovimentoContas (
  idMovimentoContas INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  numeronotafiscal VARCHAR(100),
  dataemissao DATE,
  descricao VARCHAR(500),
  status VARCHAR(20) NOT NULL,
  valortotal DECIMAL(15,2) NOT NULL,
  Pessoas_idfornecedorCliente INT,
  Pessoas_idFaturado INT,
  FOREIGN KEY (Pessoas_idfornecedorCliente) REFERENCES Pessoas(idPessoas),
  FOREIGN KEY (Pessoas_idFaturado) REFERENCES Pessoas(idPessoas)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ParcelasContas (
  idParcelasContas INT AUTO_INCREMENT PRIMARY KEY,
  Identificacao VARCHAR(100) NOT NULL,
  datavencimento DATE NOT NULL,
  valorparcela DECIMAL(15,2) NOT NULL,
  valorpago DECIMAL(15,2) NOT NULL DEFAULT 0,
  valorsaldo DECIMAL(15,2) NOT NULL,
  statusparcela VARCHAR(20) NOT NULL,
  MovimentoContas_idMovimentoContas INT NOT NULL,
  FOREIGN KEY (MovimentoContas_idMovimentoContas) REFERENCES MovimentoContas(idMovimentoContas)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS MovimentoContas_has_Classificacao (
  MovimentoContas_idMovimentoContas INT NOT NULL,
  Classificacao_idClassificacao INT NOT NULL,
  PRIMARY KEY (MovimentoContas_idMovimentoContas, Classificacao_idClassificacao),
  FOREIGN KEY (MovimentoContas_idMovimentoContas) REFERENCES MovimentoContas(idMovimentoContas) ON DELETE CASCADE,
  FOREIGN KEY (Classificacao_idClassificacao) REFERENCES Classificacao(idClassificacao) ON DELETE CASCADE
) ENGINE=InnoDB;