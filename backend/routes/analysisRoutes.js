const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// Rota para iniciar uma nova análise
router.post('/', analysisController.startAnalysis);

// Rota para buscar todas as análises
router.get('/', analysisController.getAllAnalyses);

// Rota para buscar uma análise por ID
router.get('/:id', analysisController.getAnalysisById);

// Rota para deletar uma análise por ID
router.delete('/:id', analysisController.deleteAnalysis);

module.exports = router;