import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Button, CircularProgress, Alert } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';
import InvoiceResult from './components/InvoiceResult';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);

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
    
    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      const response = await axios.post('http://localhost:5000/api/process-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setInvoiceData(response.data);
    } catch (err) {
      console.error('Erro ao processar o PDF:', err);
      setError(err.response?.data?.error || 'Erro ao processar o PDF. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setInvoiceData(null);
    setError('');
  };

  return (
    <Container maxWidth="md" className="app-container">
      <Paper elevation={3} className="main-paper">
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Processador de Notas Fiscais
        </Typography>
        
        {!invoiceData ? (
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
              >
                Selecionar PDF
              </Button>
            </label>
            
            {fileName && (
              <Typography variant="body1" className="file-name">
                Arquivo selecionado: {fileName}
              </Typography>
            )}
            
            {error && <Alert severity="error" className="error-alert">{error}</Alert>}
            
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmit}
              disabled={!file || loading}
              className="process-button"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Processar PDF'}
            </Button>
          </Box>
        ) : (
          <Box className="result-section">
            <InvoiceResult data={invoiceData} />
            <Button
              variant="outlined"
              color="primary"
              onClick={handleReset}
              className="reset-button"
            >
              Processar Outro PDF
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default App;