// backend/src/server.js
const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const { processInvoiceWithGemini } = require('./services/geminiService');
const databaseService = require('./services/databaseService');
const ragService = require('./services/ragService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// Rota para processar PDF e fazer análise
app.post('/api/process-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF enviado' });
    }

    console.log('Processando PDF:', req.file.originalname);

    // Extrair texto do PDF
    const pdfData = await pdfParse(req.file.buffer);
    const pdfText = pdfData.text;

    console.log('Texto extraído do PDF:', pdfText.substring(0, 500) + '...');

    // Processar com Gemini para extrair dados
    const invoiceData = await processInvoiceWithGemini(pdfText);

    console.log('Dados extraídos pelo Gemini:', JSON.stringify(invoiceData, null, 2));

    // Fazer análise dos dados no banco
    const analiseResult = await analisarDadosNoBanco(invoiceData);

    res.json({
      ...invoiceData,
      analise: analiseResult
    });

  } catch (error) {
    console.error('Erro no processamento:', error);
    res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    });
  }
});

// Rota para salvar todos os dados
app.post('/api/salvar-dados', async (req, res) => {
  try {
    const { invoiceData } = req.body;

    if (!invoiceData) {
      return res.status(400).json({ error: 'Dados incompletos para salvar' });
    }

    console.log('Salvando dados no banco...');

    // Salvar todos os dados no banco
    const resultadoSalvamento = await salvarTodosDados(invoiceData);

    res.json({
      success: true,
      message: 'Registro lançado com sucesso!',
      dados: resultadoSalvamento
    });

  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    res.status(500).json({ 
      error: error.message || 'Erro interno do servidor ao salvar dados' 
    });
  }
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor está funcionando',
    timestamp: new Date().toISOString()
  });
});

// ===== RAG: Indexação do esquema e consulta =====
// Recriar índice de embeddings do esquema do banco
app.post('/api/rag/index', async (req, res) => {
  try {
    const result = await ragService.buildSchemaIndex();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Erro ao indexar esquema:', error);
    res.status(500).json({ error: error.message || 'Erro ao indexar esquema' });
  }
});

// Consultar com RAG (simple ou embeddings)
app.post('/api/rag/query', async (req, res) => {
  try {
    const { question, mode } = req.body || {};
    if (!question) {
      return res.status(400).json({ error: 'Campo "question" é obrigatório' });
    }
    const selected = (mode || 'simple').toLowerCase();
    let data;
    if (selected === 'embeddings') {
      data = await ragService.queryEmbeddings(question);
    } else {
      data = await ragService.querySimple(question);
    }

    if (data && data.error) {
      return res.status(400).json(data);
    }

    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Erro na consulta RAG:', error);
    res.status(500).json({ error: error.message || 'Erro ao consultar RAG' });
  }
});

// ===== CRUD Lógico: Pessoas =====
app.get('/api/pessoas', async (req, res) => {
  try {
    const { tipo, status = 'ATIVO', q } = req.query;
    const rows = await databaseService.listarPessoas({ tipo, status, q });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar pessoas' });
  }
});

app.post('/api/pessoas', async (req, res) => {
  try {
    const { tipo, razaosocial, fantasia, documento } = req.body;
    if (!tipo || !razaosocial || !documento) {
      return res.status(400).json({ error: 'Campos obrigatórios: tipo, razaosocial, documento' });
    }
    const id = await databaseService.criarPessoa({ tipo, razaosocial, fantasia, documento });
    res.json({ success: true, id });
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar pessoa' });
  }
});

app.put('/api/pessoas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { razaosocial, fantasia, documento } = req.body;
    const ok = await databaseService.atualizarPessoa(id, { razaosocial, fantasia, documento });
    res.json({ success: ok });
  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar pessoa' });
  }
});

app.delete('/api/pessoas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await databaseService.inativarPessoa(id);
    res.json({ success: ok });
  } catch (error) {
    console.error('Erro ao inativar pessoa:', error);
    res.status(500).json({ error: error.message || 'Erro ao inativar pessoa' });
  }
});

// ===== CRUD Lógico: Classificacao =====
app.get('/api/classificacao', async (req, res) => {
  try {
    const { tipo, status = 'ATIVO', q } = req.query;
    const rows = await databaseService.listarClassificacao({ tipo, status, q });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erro ao listar classificacao:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar classificacao' });
  }
});

app.post('/api/classificacao', async (req, res) => {
  try {
    const { tipo, descricao } = req.body;
    if (!tipo || !descricao) {
      return res.status(400).json({ error: 'Campos obrigatórios: tipo, descricao' });
    }
    const id = await databaseService.criarClassificacao({ tipo, descricao });
    res.json({ success: true, id });
  } catch (error) {
    console.error('Erro ao criar classificacao:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar classificacao' });
  }
});

app.put('/api/classificacao/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao } = req.body;
    const ok = await databaseService.atualizarClassificacao(id, { descricao });
    res.json({ success: ok });
  } catch (error) {
    console.error('Erro ao atualizar classificacao:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar classificacao' });
  }
});

app.delete('/api/classificacao/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await databaseService.inativarClassificacao(id);
    res.json({ success: ok });
  } catch (error) {
    console.error('Erro ao inativar classificacao:', error);
    res.status(500).json({ error: error.message || 'Erro ao inativar classificacao' });
  }
});

// ===== CRUD Lógico: Contas (MovimentoContas) =====
app.get('/api/contas', async (req, res) => {
  try {
    const { status = 'ATIVO', q } = req.query;
    const rows = await databaseService.listarMovimentos({ status, q });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Erro ao listar contas:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar contas' });
  }
});

app.put('/api/contas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, numeronotafiscal, dataemissao, descricao, valortotal } = req.body;
    const ok = await databaseService.atualizarMovimento(id, { tipo, numeronotafiscal, dataemissao, descricao, valortotal });
    res.json({ success: ok });
  } catch (error) {
    console.error('Erro ao atualizar movimento:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar movimento' });
  }
});

app.delete('/api/contas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await databaseService.inativarMovimento(id);
    res.json({ success: ok });
  } catch (error) {
    console.error('Erro ao inativar movimento:', error);
    res.status(500).json({ error: error.message || 'Erro ao inativar movimento' });
  }
});

// Função para analisar dados no banco
async function analisarDadosNoBanco(invoiceData) {
  const analise = {
    fornecedor: null,
    faturado: null,
    classificacoes: []
  };

  // Analisar fornecedor
  if (invoiceData.fornecedor && invoiceData.fornecedor.cnpj) {
    console.log('Consultando fornecedor no banco:', invoiceData.fornecedor.cnpj);
    analise.fornecedor = await databaseService.consultarFornecedor(
      invoiceData.fornecedor.cnpj
    );
  }

  // Analisar faturado
  if (invoiceData.faturado && invoiceData.faturado.cpf) {
    console.log('Consultando faturado no banco:', invoiceData.faturado.cpf);
    analise.faturado = await databaseService.consultarFaturado(
      invoiceData.faturado.cpf
    );
  }

  // Analisar classificações de despesa
  if (invoiceData.notaFiscal && invoiceData.notaFiscal.classificacoesDespesa) {
    for (const classificacao of invoiceData.notaFiscal.classificacoesDespesa) {
      console.log('Consultando classificação no banco:', classificacao.descricao);
      const resultadoClassificacao = await databaseService.consultarClassificacaoDespesa(
        classificacao.descricao
      );
      
      analise.classificacoes.push({
        classificacao,
        resultado: resultadoClassificacao
      });
    }
  }

  return analise;
}

// Função para salvar todos os dados
async function salvarTodosDados(invoiceData) {
  const idsCadastrados = {
    fornecedorId: null,
    faturadoId: null,
    classificacoesIds: []
  };

  // Salvar fornecedor se não existir
  if (invoiceData.fornecedor && invoiceData.fornecedor.cnpj) {
    const resultadoFornecedor = await databaseService.consultarFornecedor(
      invoiceData.fornecedor.cnpj
    );
    
    if (!resultadoFornecedor.existe) {
      console.log('Criando novo fornecedor:', invoiceData.fornecedor.razaoSocial);
      idsCadastrados.fornecedorId = await databaseService.criarFornecedor(invoiceData.fornecedor);
    } else {
      idsCadastrados.fornecedorId = resultadoFornecedor.id;
    }
  }

  // Salvar faturado se não existir
  if (invoiceData.faturado && invoiceData.faturado.cpf) {
    const resultadoFaturado = await databaseService.consultarFaturado(
      invoiceData.faturado.cpf
    );
    
    if (!resultadoFaturado.existe) {
      console.log('Criando novo faturado:', invoiceData.faturado.nomeCompleto);
      idsCadastrados.faturadoId = await databaseService.criarFaturado(invoiceData.faturado);
    } else {
      idsCadastrados.faturadoId = resultadoFaturado.id;
    }
  }

  // Salvar classificações se não existirem
  if (invoiceData.notaFiscal && invoiceData.notaFiscal.classificacoesDespesa) {
    for (const classificacao of invoiceData.notaFiscal.classificacoesDespesa) {
      const resultadoClassificacao = await databaseService.consultarClassificacaoDespesa(
        classificacao.descricao
      );
      
      if (!resultadoClassificacao.existe) {
        console.log('Criando nova classificação:', classificacao.descricao);
        const novaClassificacaoId = await databaseService.criarClassificacaoDespesa(
          classificacao
        );
        idsCadastrados.classificacoesIds.push(novaClassificacaoId);
      } else {
        idsCadastrados.classificacoesIds.push(resultadoClassificacao.id);
      }
    }
  }

  // Criar movimento de contas
  console.log('Criando movimento de contas...');
  const movimentoId = await databaseService.criarMovimentoContas({
    tipo: 'APAGAR',
    numeroNotaFiscal: invoiceData.notaFiscal?.numero,
    dataEmissao: invoiceData.notaFiscal?.dataEmissao,
    descricao: invoiceData.notaFiscal?.descricaoProdutos,
    valorTotal: invoiceData.notaFiscal?.valorTotal || 0,
    idFornecedor: idsCadastrados.fornecedorId,
    idFaturado: idsCadastrados.faturadoId
  });

  // Criar parcelas
  if (invoiceData.notaFiscal?.parcelas && invoiceData.notaFiscal.parcelas.length > 0) {
    console.log('Criando parcelas...');
    await databaseService.criarParcelas(movimentoId, invoiceData.notaFiscal.parcelas);
  }

  // Vincular classificações
  if (idsCadastrados.classificacoesIds.length > 0) {
    console.log('Vinculando classificações...');
    await databaseService.vincularClassificacoes(movimentoId, idsCadastrados.classificacoesIds);
  }

  return {
    movimentoId,
    ...idsCadastrados
  };
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Health check disponível em: http://localhost:${PORT}/api/health`);
});