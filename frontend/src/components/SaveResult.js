// frontend/src/components/SaveResult.js
import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const SaveResult = ({ savedData, onBack, onProcessAnother }) => {
  // Usar onProcessAnother se disponível, caso contrário usar onBack para compatibilidade
  const handleProcessAnother = onProcessAnother || onBack;

  return (
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
      <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom color="success.main">
        Registro Lançado com Sucesso!
      </Typography>
      
      <Alert severity="success" sx={{ mb: 3 }}>
        Todos os dados foram salvos no banco de dados. Na próxima vez que processar um PDF com os mesmos dados, o sistema mostrará que eles já existem.
      </Alert>

      {savedData && (
        <Box sx={{ textAlign: 'left', backgroundColor: '#f5f5f5', p: 3, borderRadius: 1, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            IDs Gerados no Banco:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Movimento:</Typography>
              <Typography variant="body1">{savedData.movimentoId}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Fornecedor:</Typography>
              <Typography variant="body1">{savedData.fornecedorId}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Faturado:</Typography>
              <Typography variant="body1">{savedData.faturadoId}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Classificações:</Typography>
              <Typography variant="body1">
                {savedData.classificacoesIds.join(', ')}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        startIcon={<RestartAltIcon />}
        onClick={handleProcessAnother}
        size="large"
      >
        Processar Outro PDF
      </Button>
    </Paper>
  );
};

export default SaveResult;

