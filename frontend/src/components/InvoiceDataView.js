// src/components/InvoiceDataView.js
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const InvoiceDataView = ({ data, onNext }) => {
  const { fornecedor, faturado, notaFiscal, analise } = data;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const renderStatus = (resultado, tipo) => {
    if (resultado && resultado.existe) {
      return (
        <Chip 
          icon={<CheckCircleIcon />} 
          label={`EXISTE – ID: ${resultado.id}`} 
          color="success" 
          variant="outlined" 
          size="small"
          sx={{ ml: 1 }}
        />
      );
    } else {
      return (
        <Chip 
          icon={<ErrorIcon />} 
          label="NÃO EXISTE" 
          color="warning" 
          variant="outlined" 
          size="small"
          sx={{ ml: 1 }}
        />
      );
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom color="primary">
        📋 Dados Extraídos do PDF
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Confira os dados extraídos da nota fiscal antes de prosseguir para a análise no banco.
      </Typography>

      {/* Fornecedor */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            FORNECEDOR
          </Typography>
          {analise.fornecedor && renderStatus(analise.fornecedor, 'fornecedor')}
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">Razão Social</Typography>
            <Typography variant="body1" fontWeight="medium">
              {fornecedor?.razaoSocial || 'Não informado'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">Nome Fantasia</Typography>
            <Typography variant="body1">
              {fornecedor?.fantasia || 'Não informado'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">CNPJ</Typography>
            <Typography variant="body1" fontFamily="monospace">
              {fornecedor?.cnpj || 'Não informado'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Faturado */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            FATURADO
          </Typography>
          {analise.faturado && renderStatus(analise.faturado, 'faturado')}
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Nome Completo</Typography>
            <Typography variant="body1" fontWeight="medium">
              {faturado?.nomeCompleto || 'Não informado'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">CPF</Typography>
            <Typography variant="body1" fontFamily="monospace">
              {faturado?.cpf || 'Não informado'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Nota Fiscal */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          NOTA FISCAL
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">Número</Typography>
            <Typography variant="body1" fontWeight="medium">
              {notaFiscal?.numero || 'Não informado'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">Data Emissão</Typography>
            <Typography variant="body1">
              {formatDate(notaFiscal?.dataEmissao) || 'Não informado'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="text.secondary">Valor Total</Typography>
            <Typography variant="body1" fontWeight="medium" color="primary">
              {formatCurrency(notaFiscal?.valorTotal)}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Descrição dos Produtos/Serviços</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              {notaFiscal?.descricaoProdutos || 'Não informado'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Classificações de Despesa */}
      {notaFiscal?.classificacoesDespesa && notaFiscal.classificacoesDespesa.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            CLASSIFICAÇÕES DE DESPESA
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Descrição</strong></TableCell>
                  <TableCell><strong>Status no Banco</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notaFiscal.classificacoesDespesa.map((classificacao, index) => (
                  <TableRow key={index}>
                    <TableCell>{classificacao.codigo}</TableCell>
                    <TableCell>{classificacao.descricao}</TableCell>
                    <TableCell>
                      {analise.classificacoes[index] && 
                       renderStatus(analise.classificacoes[index].resultado, 'classificacao')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Parcelas */}
      {notaFiscal?.parcelas && notaFiscal.parcelas.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            PARCELAS ({notaFiscal.parcelas.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Parcela</strong></TableCell>
                  <TableCell><strong>Vencimento</strong></TableCell>
                  <TableCell align="right"><strong>Valor</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notaFiscal.parcelas.map((parcela, index) => (
                  <TableRow key={index}>
                    <TableCell>Parcela {parcela.numero || index + 1}</TableCell>
                    <TableCell>{formatDate(parcela.dataVencimento)}</TableCell>
                    <TableCell align="right">{formatCurrency(parcela.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Botão de Continuar */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          endIcon={<NavigateNextIcon />}
          onClick={onNext}
          size="large"
          sx={{ minWidth: 200 }}
        >
          Continuar para Análise
        </Button>
      </Box>
    </Box>
  );
};

export default InvoiceDataView;