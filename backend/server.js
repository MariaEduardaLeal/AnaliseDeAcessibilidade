const express = require('express');
const sequelize = require('./config/database');
const analysisRoutes = require('./routes/analysisRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar JSON nas requisições
app.use(express.json());

// Adiciona as rotas de análise com o prefixo '/api/analyses'
app.use('/api/analyses', analysisRoutes);

// Sincroniza os modelos e inicia o servidor
sequelize.sync()
  .then(() => {
    console.log('Tabelas sincronizadas com sucesso.');
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar com o banco de dados:', err);
  });