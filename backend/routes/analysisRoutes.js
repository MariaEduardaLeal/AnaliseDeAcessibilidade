const express = require('express');
const analysisController = require('../controllers/analysisController');

const router = express.Router();

router.post('/', analysisController.startAnalysis);
router.get('/', analysisController.getAllAnalyses);
router.get('/runtime/stats', analysisController.getRuntimeStats);
router.get('/:id', analysisController.getAnalysisById);
router.delete('/:id', analysisController.deleteAnalysis);

module.exports = router;
