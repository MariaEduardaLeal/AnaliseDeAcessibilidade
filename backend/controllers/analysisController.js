const Analysis = require('../models/Analysis');

// Controlador para iniciar uma nova análise
exports.startAnalysis = async (req, res) => {
  try {
    const { url } = req.body;

    // Validação básica da URL
    if (!url) {
      return res.status(400).json({ error: 'A URL é obrigatória.' });
    }

    // Cria a análise inicial no banco de dados com status 'processing'
    const newAnalysis = await Analysis.create({ url });

    // --- AQUI ENTRARÁ A LÓGICA DO PUPPETEER E AXE-CORE ---
    //
    // Em um cenário real, esta parte rodaria em segundo plano
    // (com um sistema de filas) para não travar a requisição HTTP.
    // Por enquanto, vamos simular o resultado.
    //
    // Lembre-se de instalar as dependências: npm install puppeteer @axe-core/puppeteer
    // E de criar uma função para a análise real.
    //
    // Exemplo:
    // analyzePage(url, newAnalysis.id);
    //
    // A lógica de simulação será adicionada no próximo passo para testarmos o fluxo completo.

    return res.status(201).json({
      message: 'Análise iniciada com sucesso!',
      analysis: newAnalysis,
    });

  } catch (error) {
    console.error('Erro ao iniciar a análise:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Controlador para buscar todas as análises
exports.getAllAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.findAll({
      order: [['createdAt', 'DESC']], // Ordena por data de criação (mais recente primeiro)
    });
    return res.status(200).json(analyses);
  } catch (error) {
    console.error('Erro ao buscar análises:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Controlador para buscar uma análise por ID
exports.getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await Analysis.findByPk(id);

    if (!analysis) {
      return res.status(404).json({ error: 'Análise não encontrada.' });
    }

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Erro ao buscar análise:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// Controlador para deletar uma análise por ID
exports.deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await Analysis.findByPk(id);

    if (!analysis) {
      return res.status(404).json({ error: 'Análise não encontrada.' });
    }

    await analysis.destroy();
    return res.status(200).json({ message: 'Análise deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar análise:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};