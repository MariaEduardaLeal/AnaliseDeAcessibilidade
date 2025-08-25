const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const Analysis = require('../models/Analysis');

// Função de análise que será executada em segundo plano
async function analyzePage(url, analysisId) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true, // Modo sem interface, mais rápido
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const axeBuilder = new AxePuppeteer(page, {
        iframes: false // Não analisar iframes para simplificar
    });

    const results = await axeBuilder.analyze();

    // A lógica de pontuação e formatação dos resultados pode ser customizada
    const score = calculateScore(results);

    // Atualiza o registro no banco de dados com os resultados
    await Analysis.update({
      status: 'completed',
      score: score,
      results: results,
    }, {
      where: { id: analysisId },
    });
    
    console.log(`Análise concluída para a URL: ${url}`);

  } catch (error) {
    console.error(`Erro ao analisar a página ${url}:`, error);
    // Em caso de erro, atualiza o status no banco de dados
    await Analysis.update({
      status: 'error',
    }, {
      where: { id: analysisId },
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Função simples para calcular uma pontuação baseada nos resultados do Axe
function calculateScore(results) {
  const totalIssues = results.violations.length + results.incomplete.length;
  const passedChecks = results.passes.length;
  
  // A pontuação é uma métrica simples, pode ser ajustada
  if (totalIssues === 0) return 100;
  
  const score = Math.max(0, 100 - (totalIssues * 5)); // Exemplo de cálculo simples
  return score;
}

// Controlador para iniciar uma nova análise
exports.startAnalysis = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'A URL é obrigatória.' });
    }

    const newAnalysis = await Analysis.create({ url });

    // Inicia a análise em segundo plano para não travar a requisição
    analyzePage(url, newAnalysis.id);

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
      order: [['createdAt', 'DESC']],
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