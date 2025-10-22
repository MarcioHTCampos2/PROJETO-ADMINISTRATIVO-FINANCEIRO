// frontend/src/components/InvoiceAnalysis.js
import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SaveIcon from '@mui/icons-material/Save';

const InvoiceAnalysis = ({ data, onSaveSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  if (!data || !data.analise) {
    return null;
  }

  const { analise } = data;

  const handleSave = async () => {
    setLoading(true);
    setSaveResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/salvar-dados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceData: data
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSaveResult({ type: 'success', message: result.message });
        if (onSaveSuccess) {
          onSaveSuccess(result.dados);
        }
      } else {
        setSaveResult({ type: 'error', message: result.error });
      }
    } catch (error) {
      setSaveResult({ type: 'error', message: 'Erro ao salvar dados no banco' });
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (resultado, tipo) => {
    if (resultado.existe) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Chip 
            icon={<CheckCircleIcon />} 
            label={`EXISTE – ID: ${resultado.id}`} 
            color="success" 
            variant="outlined" 
            size="small"
          />
        </Box>
      );
    } else {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Chip 
            icon={<ErrorIcon />} 
            label="NÃO EXISTE" 
            color="warning" 
            variant="outlined" 
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            (Será criado ao confirmar)
          </Typography>
        </Box>
      );
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Análise dos Dados Extraídos
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Verifique os dados extraídos do PDF e confirme para salvar no banco de dados.
      </Typography>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            FORNECEDOR:
          </Typography>
          {analise.fornecedor && data.fornecedor && (
            <Box sx={{ pl: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                {data.fornecedor.razaoSocial}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CNPJ: {data.fornecedor.cnpj}
              </Typography>
              {renderStatus(analise.fornecedor, 'fornecedor')}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            FATURADO:
          </Typography>
          {analise.faturado && data.faturado && (
            <Box sx={{ pl: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                {data.faturado.nomeCompleto}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CPF: {data.faturado.cpf}
              </Typography>
              {renderStatus(analise.faturado, 'faturado')}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            CLASSIFICAÇÕES DE DESPESA:
          </Typography>
          {analise.classificacoes.map((item, index) => (
            <Box key={index} sx={{ pl: 2, mb: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                {item.classificacao.descricao}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Código: {item.classificacao.codigo}
              </Typography>
              {renderStatus(item.resultado, 'classificacao')}
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Informações da Nota Fiscal */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dados da Nota Fiscal
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Número NF</Typography>
            <Typography variant="body1">{data.notaFiscal?.numero || 'Não informado'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Valor Total</Typography>
            <Typography variant="body1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                data.notaFiscal?.valorTotal || 0
              )}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Parcelas</Typography>
            <Typography variant="body1">
              {data.notaFiscal?.parcelas?.length || 0} parcela(s)
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Ações */}
      {!saveResult && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={loading}
            size="large"
          >
            Voltar para Edição
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading}
            size="large"
          >
            {loading ? 'Salvando...' : 'Confirmar e Salvar no Banco'}
          </Button>
        </Box>
      )}

      {/* Resultado do Salvamento */}
      {saveResult && (
        <Alert 
          severity={saveResult.type} 
          sx={{ mt: 3 }}
          action={
            <Button color="inherit" size="small" onClick={onBack}>
              Processar Outro PDF
            </Button>
          }
        >
          {saveResult.message}
        </Alert>
      )}
    </Box>
  );
};

export default InvoiceAnalysis;