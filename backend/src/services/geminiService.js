const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Configuração da API do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Processa o texto da nota fiscal usando o modelo Gemini
 * @param {string} pdfText - Texto extraído do PDF
 * @returns {Object} - Dados estruturados da nota fiscal
 */
async function processInvoiceWithGemini(pdfText) {
  try {
    // Usar o modelo Gemini Pro padrão que é compatível com a API atual
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prompt para extrair informações específicas da nota fiscal
    const prompt = `
    Extraia as seguintes informações desta nota fiscal e retorne em formato JSON:
    
    Fornecedor:
    - Razão Social
    - Fantasia
    - CNPJ
    
    Faturado:
    - Nome Completo
    - CPF
    
    Detalhes da Nota:
    - Número da Nota Fiscal
    - Data de Emissão (Formato YYYY-MM-DD)
    - Descrição dos produtos
    - Quantidade de Parcelas
    - Data de Vencimento
    - ValorTotal (Formato YYYY-MM-DD)
    
    Classificação da DESPESA:
    - Analise os produtos/serviços descritos na nota fiscal e classifique a despesa de acordo com a natureza do gasto.
    - Cada nota fiscal deve ter pelo menos uma classificação de despesa.
    - PRINCIPAIS CATEGORIAS DE DESPESAS:
      * Código: "1", Descrição: "INSUMOS AGRÍCOLAS" (Sementes, Fertilizantes, Defensivos Agrícolas, Corretivos)
      * Código: "2", Descrição: "MANUTENÇÃO E OPERAÇÃO" (Combustíveis e Lubrificantes, Peças, Parafusos, Componentes Mecânicos, Manutenção de Máquinas e Equipamentos, Pneus, Filtros, Correias, Ferramentas e Utensílios)
      * Código: "3", Descrição: "RECURSOS HUMANOS" (Mão de Obra Temporária, Salários e Encargos)
      * Código: "4", Descrição: "SERVIÇOS OPERACIONAIS" (Frete e Transporte, Colheita Terceirizada, Secagem e Armazenagem, Pulverização e Aplicação)
      * Código: "5", Descrição: "INFRAESTRUTURA E UTILIDADES" (Energia Elétrica, Arrendamento de Terras, Construções e Reformas, Materiais de Construção)
      * Código: "6", Descrição: "ADMINISTRATIVAS" (Honorários Contábeis, Advocatícios, Agronômicos, Despesas Bancárias e Financeiras)
      * Código: "7", Descrição: "SEGUROS E PROTEÇÃO" (Seguro Agrícola, Seguro de Ativos, Seguro Prestamista)
      * Código: "8", Descrição: "IMPOSTOS E TAXAS" (ITR, IPTU, IPVA, INCRA-CCIR)
      * Código: "9", Descrição: "INVESTIMENTOS" (Aquisição de Máquinas e Implementos, Aquisição de Veículos, Aquisição de Imóveis, Infraestrutura Rural)
      * Código: "10", Descrição: "OUTROS" (Quando não se encaixar em nenhuma categoria acima)
    
    - Exemplos específicos:
      * Compra de Óleo Diesel → Classifica-se na categoria "MANUTENÇÃO E OPERAÇÃO" (Código: "2")
      * Compra de Material Hidráulico → Classifica-se na categoria "INFRAESTRUTURA E UTILIDADES" (Código: "5")
    
    - Baseie-se na descrição dos produtos/serviços para determinar a classificação mais adequada.
    - Se não for possível determinar com precisão, use a classificação "10 - OUTROS".
    
    Texto da nota fiscal:
    ${pdfText}
    
    Retorne apenas o JSON com a seguinte estrutura:
    {
      "fornecedor": {
        "razaoSocial": "",
        "fantasia": "",
        "cnpj": ""
      },
      "faturado": {
        "nomeCompleto": "",
        "cpf": ""
      },
      "notaFiscal": {
        "numero": "",
        "dataEmissao": "", (Formato YYYY-MM-DD)
        "descricaoProdutos": "",
        "parcelas": [
          {
            "numero": 1,
            "dataVencimento": "", (Formato YYYY-MM-DD)
            "valor": 0
          }
        ],
        "valorTotal": 0,
        "classificacoesDespesa": [
          {
            "codigo": "",
            "descricao": ""
          }
        ]
      }
    }
    
    Importante: Preencha todos os campos possíveis. Se alguma informação não estiver disponível, deixe o campo vazio ou com valor padrão.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extrair o JSON da resposta
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    
    if (jsonMatch) {
      try {
        // Tentar analisar o JSON extraído
        const jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return jsonData;
      } catch (parseError) {
        console.error('Erro ao analisar JSON:', parseError);
        // Tentar limpar e analisar novamente
        const cleanedJson = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedJson);
      }
    } else {
      throw new Error('Não foi possível extrair JSON da resposta');
    }
  } catch (error) {
    console.error('Erro ao processar com Gemini:', error);
    throw error;
  }
}

module.exports = { processInvoiceWithGemini };