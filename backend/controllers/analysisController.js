const analysisService = require('../services/analysisService');

exports.startAnalysis = async (req, res) => {
  try {
    const { url } = req.body;
    const analysis = await analysisService.createAnalysis(url);

    return res.status(201).json({
      message: 'Analise iniciada com sucesso.',
      analysis,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Erro interno do servidor.' : error.message;
    if (statusCode === 500) {
      console.error('Erro ao iniciar a analise:', error);
    }
    return res.status(statusCode).json({ error: message });
  }
};

exports.getAllAnalyses = async (_req, res) => {
  try {
    const analyses = await analysisService.listAnalyses();
    return res.status(200).json(analyses);
  } catch (error) {
    console.error('Erro ao buscar analises:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

exports.getAnalysisById = async (req, res) => {
  try {
    const analysis = await analysisService.getAnalysisById(req.params.id);

    if (!analysis) {
      return res.status(404).json({ error: 'Analise nao encontrada.' });
    }

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Erro ao buscar analise:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

exports.deleteAnalysis = async (req, res) => {
  try {
    const deleted = await analysisService.deleteAnalysis(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Analise nao encontrada.' });
    }

    return res.status(200).json({ message: 'Analise deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar analise:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

exports.getRuntimeStats = async (_req, res) => {
  try {
    return res.status(200).json(analysisService.getRuntimeStats());
  } catch (error) {
    console.error('Erro ao buscar estatisticas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};
