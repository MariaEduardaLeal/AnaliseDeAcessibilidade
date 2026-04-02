const express = require('express');
const path = require('path');
const cors = require('cors');
const analysisRoutes = require('./routes/analysisRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..');

app.use(cors());
app.use(express.json());

app.use('/styles', express.static(path.join(FRONTEND_DIR, 'styles')));
app.use('/scripts', express.static(path.join(FRONTEND_DIR, 'scripts')));
app.use('/locales', express.static(path.join(FRONTEND_DIR, 'locales')));

app.use('/api/analyses', analysisRoutes);

app.get('/', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.get('/index.html', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.get('/report.html', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'report.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
