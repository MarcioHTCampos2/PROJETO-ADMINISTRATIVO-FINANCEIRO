# backend/Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o código fonte (incluindo a pasta src)
COPY src/ ./src/

# Criar diretório para uploads
RUN mkdir -p uploads

# Expor a porta
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["npm", "start"]