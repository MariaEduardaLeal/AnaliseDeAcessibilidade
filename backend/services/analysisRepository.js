const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'analyses.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readAll() {
  ensureStorage();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');

  try {
    const parsed = JSON.parse(raw);
    const analyses = Array.isArray(parsed) ? parsed : [];
    let changed = false;

    const sanitized = analyses.map((analysis) => {
      if (analysis?.results?.raw) {
        const nextAnalysis = clone(analysis);
        delete nextAnalysis.results.raw;
        changed = true;
        return nextAnalysis;
      }

      return analysis;
    });

    if (changed) {
      writeAll(sanitized);
    }

    return sanitized;
  } catch (_) {
    return [];
  }
}

function writeAll(analyses) {
  ensureStorage();
  fs.writeFileSync(DATA_FILE, JSON.stringify(analyses, null, 2), 'utf8');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function createAnalysis({ url, status = 'processing', score = null, results = null, meta = {} }) {
  const now = new Date().toISOString();
  const analysis = {
    id: randomUUID(),
    url,
    status,
    score,
    results,
    meta,
    createdAt: now,
    updatedAt: now,
  };

  const analyses = readAll();
  analyses.push(analysis);
  writeAll(analyses);

  return clone(analysis);
}

async function listAnalyses() {
  return readAll()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map(clone);
}

async function getAnalysisById(id) {
  const analysis = readAll().find((item) => item.id === id);
  return analysis ? clone(analysis) : null;
}

async function updateAnalysis(id, patch) {
  const analyses = readAll();
  let updatedAnalysis = null;

  const updated = analyses.map((analysis) => {
    if (analysis.id !== id) {
      return analysis;
    }

    updatedAnalysis = {
      ...analysis,
      ...patch,
      meta: {
        ...(analysis.meta || {}),
        ...(patch.meta || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    return updatedAnalysis;
  });

  writeAll(updated);
  return updatedAnalysis ? clone(updatedAnalysis) : null;
}

async function deleteAnalysis(id) {
  const analyses = readAll();
  const existing = analyses.find((analysis) => analysis.id === id);

  if (!existing) {
    return false;
  }

  writeAll(analyses.filter((analysis) => analysis.id !== id));
  return true;
}

module.exports = {
  createAnalysis,
  deleteAnalysis,
  getAnalysisById,
  listAnalyses,
  updateAnalysis,
};
