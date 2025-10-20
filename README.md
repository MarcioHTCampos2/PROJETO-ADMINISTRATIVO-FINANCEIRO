# Processador de Notas Fiscais com LLM (Gemini)

Este projeto implementa um processador de PDF para extrair dados de notas fiscais (contas a pagar) utilizando o modelo de linguagem Gemini da Google e retornar os dados em formato JSON estruturado.

## Funcionalidades

- Upload de arquivos PDF de notas fiscais
- Extração de texto do PDF
- Processamento do texto com Gemini LLM
- Extração estruturada dos seguintes dados:
  - **Fornecedor**: Razão Social, Fantasia, CNPJ
  - **Faturado**: Nome Completo, CPF
  - **Nota Fiscal**: Número, Data de Emissão, Descrição dos produtos
  - **Parcelas**: Suporte para múltiplas parcelas
  - **Classificação de Despesa**: Suporte para múltiplas classificações

## Estrutura do Projeto

```
.
├── backend/                # Servidor Node.js
│   ├── uploads/            # Pasta temporária para uploads de PDFs
│   ├── server.js           # Servidor Express
│   ├── geminiService.js    # Serviço de integração com Gemini
│   ├── package.json        # Dependências do backend
│   └── .env                # Variáveis de ambiente (chave API Gemini)
│
└── frontend/               # Aplicação React
    ├── public/             # Arquivos estáticos
    └── src/                # Código fonte React
        ├── components/     # Componentes React
        │   └── InvoiceResult.js  # Componente para exibir resultados
        ├── App.js          # Componente principal
        ├── App.css         # Estilos do componente principal
        ├── index.js        # Ponto de entrada da aplicação
        └── index.css       # Estilos globais
```

## Tecnologias Utilizadas

### Backend
- Node.js
- Express
- Multer (para upload de arquivos)
- pdf-parse (para extração de texto de PDFs)
- Google Generative AI (API Gemini)

### Frontend
- React
- Material UI
- Axios (para requisições HTTP)

## Como Executar

### Pré-requisitos
- Node.js (v14 ou superior)
- NPM ou Yarn

### Configuração do Backend
1. Navegue até a pasta do backend:
   ```
   cd backend
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Verifique se o arquivo `.env` contém a chave da API Gemini:
   ```
   GEMINI_API_KEY=AIzaSyCOHbhUaZdxTufCWxoP24dThplKrjPb2Jo
   PORT=5000
   ```

4. Inicie o servidor:
   ```
   npm start
   ```

### Configuração do Frontend
1. Navegue até a pasta do frontend:
   ```
   cd frontend
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Inicie a aplicação React:
   ```
   npm start
   ```

4. Acesse a aplicação em seu navegador:
   ```
   http://localhost:3000
   ```

## Estrutura do JSON de Saída

```json
{
  "fornecedor": {
    "razaoSocial": "Nome da Empresa Ltda",
    "fantasia": "Nome Fantasia",
    "cnpj": "12.345.678/0001-90"
  },
  "faturado": {
    "nomeCompleto": "Nome do Cliente",
    "cpf": "123.456.789-00"
  },
  "notaFiscal": {
    "numero": "12345",
    "dataEmissao": "2023-01-01",
    "descricaoProdutos": "Descrição dos produtos ou serviços",
    "parcelas": [
      {
        "numero": 1,
        "dataVencimento": "2023-02-01",
        "valor": 1000.00
      }
    ],
    "valorTotal": 1000.00,
    "classificacoesDespesa": [
      {
        "codigo": "123",
        "descricao": "Descrição da despesa"
      }
    ]
  }
}
```

## Observações

- O sistema está configurado para processar uma parcela por padrão, mas a estrutura suporta múltiplas parcelas.
- Da mesma forma, o sistema está configurado para uma classificação de despesa por registro, mas a estrutura suporta múltiplas classificações.
- A API Gemini é utilizada para extrair informações estruturadas do texto do PDF.