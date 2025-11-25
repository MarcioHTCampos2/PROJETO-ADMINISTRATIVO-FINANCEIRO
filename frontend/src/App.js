// App.js (atualizado)
import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Button, CircularProgress, Alert, ToggleButtonGroup, ToggleButton, Divider } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';
import InvoiceResult from './components/InvoiceResult';
import RagQuery from './components/RagQuery';
import ManterPessoas from './components/ManterPessoas';
import ManterClassificacao from './components/ManterClassificacao';
import ManterContas from './components/ManterContas';
import './App.css';
const API_BASE = process.env.REACT_APP_API_URL || '';

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [processingStep, setProcessingStep] = useState('upload'); // 'upload', 'processing', 'result'
  const [view, setView] = useState('pdf'); // 'pdf' | 'rag' | 'contas' | 'pessoas' | 'classificacao'

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    } else {
      setFile(null);
      setFileName('');
      setError('Por favor, selecione um arquivo PDF válido.');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo PDF.');
      return;
    }

    setLoading(true);
    setError('');
    setProcessingStep('processing');
    
    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      const response = await axios.post(`${API_BASE}/api/process-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 segundos timeout para processamento do PDF
      });
      
      setInvoiceData(response.data);
      setProcessingStep('result');
    } catch (err) {
      console.error('Erro ao processar o PDF:', err);
      if (err.code === 'ECONNABORTED') {
        setError('Tempo limite excedido. O PDF pode ser muito complexo. Tente novamente.');
      } else {
        setError(err.response?.data?.error || 'Erro ao processar o PDF. Por favor, tente novamente.');
      }
      setProcessingStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setInvoiceData(null);
    setError('');
    setProcessingStep('upload');
  };

  const handleProcessAnother = () => {
    handleReset();
  };

  // Renderizar conteúdo baseado no passo atual
  const renderPdfContent = () => {
    switch (processingStep) {
      case 'upload':
        return (
          <Box className="upload-section">
            <input
              accept="application/pdf"
              style={{ display: 'none' }}
              id="pdf-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="pdf-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadFileIcon />}
                color="primary"
                fullWidth
                size="large"
              >
                Selecionar PDF da Nota Fiscal
              </Button>
            </label>
            
            {fileName && (
              <Typography variant="body1" className="file-name">
                <strong>Arquivo selecionado:</strong> {fileName}
              </Typography>
            )}
            
            {error && (
              <Alert severity="error" className="error-alert">
                {error}
              </Alert>
            )}
            
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmit}
              disabled={!file || loading}
              className="process-button"
              size="large"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Processar PDF'}
            </Button>
          </Box>
        );

      case 'processing':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Processando PDF...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Extraindo dados e consultando banco de dados...
            </Typography>
          </Box>
        );

      case 'result':
        return (
          <Box className="result-section">
            <InvoiceResult 
              data={invoiceData} 
              onProcessAnother={handleProcessAnother}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  const renderContent = () => {
    if (view === 'rag') {
      return (
        <Box className="rag-section">
          <RagQuery />
        </Box>
      );
    }
    if (view === 'contas') {
      return (
        <Box className="contas-section">
          <ManterContas />
        </Box>
      );
    }
    if (view === 'pessoas') {
      return (
        <Box className="pessoas-section">
          <ManterPessoas />
        </Box>
      );
    }
    if (view === 'classificacao') {
      return (
        <Box className="classificacao-section">
          <ManterClassificacao />
        </Box>
      );
    }
    return renderPdfContent();
  };

  return (
    <Container maxWidth="md" className="app-container">
      <Paper elevation={3} className="main-paper">
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Processador de Notas Fiscais e Busca RAG
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ToggleButtonGroup
            color="primary"
            value={view}
            exclusive
            onChange={(e, val) => val && setView(val)}
            size="small"
          >
            <ToggleButton value="pdf">Notas Fiscais</ToggleButton>
            <ToggleButton value="rag">RAG Banco de Dados</ToggleButton>
            <ToggleButton value="contas">Manter Contas</ToggleButton>
            <ToggleButton value="pessoas">Manter Pessoas</ToggleButton>
            <ToggleButton value="classificacao">Manter Classificação</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {view === 'pdf' && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Extraia automaticamente dados de notas fiscais PDF e gerencie no banco de dados
          </Typography>
        )}
        {view === 'rag' && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Digite perguntas sobre o banco de dados e receba respostas elaboradas com LLM
          </Typography>
        )}
        {view === 'contas' && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Tabela vazia inicialmente. Use Busca ou Todos (ATIVO).
          </Typography>
        )}
        {view === 'pessoas' && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Gerencie Fornecedor, Cliente e Faturado. Status é oculto (ATIVO/INATIVO).
          </Typography>
        )}
        {view === 'classificacao' && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Cadastre e edite classificações de Receita/Despesa. Exclusão é lógica.
          </Typography>
        )}

        {renderContent()}
      </Paper>
    </Container>
  );
}

export default App;