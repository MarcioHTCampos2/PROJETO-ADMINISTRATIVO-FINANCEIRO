import React, { useState } from 'react';
import { 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';

const InvoiceResult = ({ data }) => {
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  if (!data) return null;

  const { fornecedor, faturado, notaFiscal } = data;
  
  const handleShowJson = () => {
    setJsonDialogOpen(true);
  };
  
  const handleCloseJsonDialog = () => {
    setJsonDialogOpen(false);
  };
  
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setSnackbarMessage('JSON copiado para a área de transferência!');
    setSnackbarOpen(true);
  };
  
  const handleDownloadJson = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `nota-fiscal-${notaFiscal?.numero || 'dados'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbarMessage('JSON baixado com sucesso!');
    setSnackbarOpen(true);
  };

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

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Resultado da Extração
      </Typography>
      
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Dados do Fornecedor
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Razão Social</Typography>
            <Typography variant="body1">{fornecedor?.razaoSocial || 'Não informado'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Nome Fantasia</Typography>
            <Typography variant="body1">{fornecedor?.fantasia || 'Não informado'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">CNPJ</Typography>
            <Typography variant="body1">{fornecedor?.cnpj || 'Não informado'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Dados do Faturado
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Nome Completo</Typography>
            <Typography variant="body1">{faturado?.nomeCompleto || 'Não informado'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">CPF</Typography>
            <Typography variant="body1">{faturado?.cpf || 'Não informado'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Dados da Nota Fiscal
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Número da NF</Typography>
            <Typography variant="body1">{notaFiscal?.numero || 'Não informado'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Data de Emissão</Typography>
            <Typography variant="body1">{formatDate(notaFiscal?.dataEmissao) || 'Não informado'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Valor Total</Typography>
            <Typography variant="body1">{formatCurrency(notaFiscal?.valorTotal)}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Descrição dos Produtos</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {notaFiscal?.descricaoProdutos || 'Não informado'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {notaFiscal?.parcelas && notaFiscal.parcelas.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Parcelas
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Data de Vencimento</TableCell>
                  <TableCell align="right">Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notaFiscal.parcelas.map((parcela, index) => (
                  <TableRow key={index}>
                    <TableCell>{parcela.numero || index + 1}</TableCell>
                    <TableCell>{formatDate(parcela.dataVencimento)}</TableCell>
                    <TableCell align="right">{formatCurrency(parcela.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {notaFiscal?.classificacoesDespesa && notaFiscal.classificacoesDespesa.length > 0 && (
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Classificações de Despesa
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Descrição</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notaFiscal.classificacoesDespesa.map((classificacao, index) => (
                  <TableRow key={index}>
                    <TableCell>{classificacao.codigo || 'Não informado'}</TableCell>
                    <TableCell>{classificacao.descricao || 'Não informado'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* Botões para JSON */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<CodeIcon />} 
          onClick={handleShowJson}
        >
          Visualizar JSON
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          startIcon={<DownloadIcon />} 
          onClick={handleDownloadJson}
        >
          Baixar JSON
        </Button>
      </Box>
      
      {/* Diálogo para exibir JSON */}
      <Dialog
        open={jsonDialogOpen}
        onClose={handleCloseJsonDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Dados em Formato JSON
          <IconButton
            aria-label="copiar"
            onClick={handleCopyJson}
            sx={{ position: 'absolute', right: 60, top: 8 }}
          >
            <ContentCopyIcon />
          </IconButton>
          <IconButton
            aria-label="baixar"
            onClick={handleDownloadJson}
            sx={{ position: 'absolute', right: 16, top: 8 }}
          >
            <DownloadIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            backgroundColor: '#f5f5f5', 
            p: 2, 
            borderRadius: 1, 
            maxHeight: '70vh', 
            overflow: 'auto',
            fontFamily: 'monospace'
          }}>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseJsonDialog}>Fechar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvoiceResult;