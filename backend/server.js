const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { processInvoiceWithGemini } = require('./geminiService');

// Configuração do Express
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'), false);
    }
  }
});

// Rota para processar o PDF
app.post('/api/process-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const pdfPath = req.file.path;
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Extrair texto do PDF
    const pdfData = await pdfParse(dataBuffer);
    const pdfText = pdfData.text;
    
    // Processar o texto com o Gemini
    const invoiceData = await processInvoiceWithGemini(pdfText);
    
    // Limpar o arquivo após processamento
    fs.unlinkSync(pdfPath);
    
    res.json(invoiceData);
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    res.status(500).json({ error: 'Erro ao processar o PDF', details: error.message });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});