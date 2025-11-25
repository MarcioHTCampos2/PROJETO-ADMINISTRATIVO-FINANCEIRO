import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, ToggleButtonGroup, ToggleButton, CircularProgress, Alert, Divider } from '@mui/material';
import axios from 'axios';
const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || '';

function RagQuery() {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState('simple'); // 'simple' | 'embeddings'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [context, setContext] = useState([]);
  const [indexing, setIndexing] = useState(false);
  const [indexInfo, setIndexInfo] = useState(null);

  const handleQuery = async () => {
    if (!question.trim()) {
      setError('Digite uma pergunta.');
      return;
    }
    setLoading(true);
    setError('');
    setAnswer('');
    setContext([]);
    try {
      const res = await axios.post(`${API_BASE}/api/rag/query`, { question, mode }, { timeout: 60000 });
      setAnswer(res.data.answer || '');
      setContext(res.data.context || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao consultar RAG.');
    } finally {
      setLoading(false);
    }
  };

  const handleIndex = async () => {
    setIndexing(true);
    setIndexInfo(null);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/rag/index`, {}, { timeout: 60000 });
      setIndexInfo(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao indexar esquema.');
    } finally {
      setIndexing(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Busca Inteligente (RAG) sobre o Banco de Dados
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Faça perguntas sobre tabelas, colunas e dados. Respostas usam RAG Simples ou RAG por Embeddings.
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <ToggleButtonGroup
          color="primary"
          value={mode}
          exclusive
          onChange={(e, val) => val && setMode(val)}
          size="small"
        >
          <ToggleButton value="simple">RAG Simples</ToggleButton>
          <ToggleButton value="embeddings">RAG Embeddings</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="outlined" onClick={handleIndex} disabled={indexing}>
          {indexing ? <CircularProgress size={20} /> : 'Reindexar Esquema'}
        </Button>
      </Box>

      {indexInfo && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Índice recriado: {indexInfo.count} documentos.
        </Alert>
      )}

      <TextField
        label="Pergunta"
        placeholder="Ex.: Quais colunas existem na tabela Pessoas?"
        fullWidth
        multiline
        minRows={2}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Button variant="contained" onClick={handleQuery} disabled={loading}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar Pergunta'}
      </Button>

      {answer && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Resposta</Typography>
          <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
            {answer}
          </Paper>
        </Box>
      )}

      {context && context.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Contexto utilizado</Typography>
          {context.map((c, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 1, whiteSpace: 'pre-wrap' }}>
              <Typography variant="caption" color="text.secondary">Trecho {idx + 1}</Typography>
              <Divider sx={{ my: 1 }} />
              {c}
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default RagQuery;