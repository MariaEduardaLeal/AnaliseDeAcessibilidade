const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const repository = require('./analysisRepository');
const queue = require('./analysisQueue');
const {
  buildAccessibleResults,
  runCustomValidations,
} = require('./accessibilityAnalysis');

const DEFAULT_TIMEOUT_MS = 60000;
const DOM_STABILITY_WINDOW_MS = 1200;
const DOM_STABILITY_ATTEMPTS = 3;

function validateUrl(url) {
  if (!url) {
    return 'A URL e obrigatoria.';
  }

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return 'Informe uma URL com http:// ou https://.';
    }
  } catch (_) {
    return 'Informe uma URL valida, incluindo http:// ou https://.';
  }

  return null;
}

function classifyError(error) {
  const message = error.message || 'Falha desconhecida.';

  if (message.includes('ERR_NAME_NOT_RESOLVED') || message.includes('ENOTFOUND')) {
    return {
      type: 'network',
      userMessage: 'Nao foi possivel localizar o dominio informado.',
    };
  }

  if (message.includes('net::ERR_CONNECTION') || message.includes('ERR_CONNECTION')) {
    return {
      type: 'network',
      userMessage: 'Nao foi possivel estabelecer conexao com o site.',
    };
  }

  if (message.includes('Navigation timeout') || message.includes('timeout')) {
    return {
      type: 'timeout',
      userMessage: 'A pagina demorou demais para carregar e a analise foi interrompida.',
    };
  }

  if (message.includes('ERR_HTTP_RESPONSE_CODE_FAILURE') || message.includes('403')) {
    return {
      type: 'blocked',
      userMessage: 'O site bloqueou ou recusou a coleta automatica.',
    };
  }

  if (message.includes('HTTP_404')) {
    return {
      type: 'http',
      userMessage: 'A pagina retornou 404 e nao pode ser analisada.',
    };
  }

  if (message.includes('HTTP_401') || message.includes('HTTP_403')) {
    return {
      type: 'blocked',
      userMessage: 'O site exige autenticacao ou bloqueou o acesso automatizado.',
    };
  }

  if (message.includes('HTTP_')) {
    return {
      type: 'http',
      userMessage: 'O site respondeu com erro HTTP e a analise nao pode continuar.',
    };
  }

  return {
    type: 'unexpected',
    userMessage: 'Nao foi possivel concluir a analise desta pagina.',
  };
}

async function waitForRealPageLoad(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT_MS });

  if (response && response.status() >= 400) {
    throw new Error(`HTTP_${response.status()}`);
  }

  await page.waitForFunction(() => document.readyState === 'complete', {
    timeout: 20000,
  }).catch(() => null);

  await page.waitForNetworkIdle({
    idleTime: 1200,
    timeout: 20000,
  }).catch(() => null);

  let previousSize = -1;
  let stablePasses = 0;

  for (let attempt = 0; attempt < 8 && stablePasses < DOM_STABILITY_ATTEMPTS; attempt += 1) {
    const currentSize = await page.evaluate(() => document.body?.innerText?.length || 0);
    if (currentSize === previousSize && currentSize > 0) {
      stablePasses += 1;
    } else {
      stablePasses = 0;
      previousSize = currentSize;
    }

    await new Promise((resolve) => setTimeout(resolve, DOM_STABILITY_WINDOW_MS));
  }
}

async function runSingleAnalysis(analysis) {
  let browser = null;
  const startedAt = Date.now();

  await repository.updateAnalysis(analysis.id, {
    status: 'processing',
    meta: {
      stage: 'loading',
      statusMessage: 'Abrindo a pagina e aguardando carregamento completo.',
      queue: queue.getQueueStats(),
    },
  });

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari');
    page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT_MS);
    page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);

    await waitForRealPageLoad(page, analysis.url);

    await repository.updateAnalysis(analysis.id, {
      meta: {
        stage: 'analyzing',
        statusMessage: 'Pagina carregada. Executando verificacoes de acessibilidade.',
      },
    });

    const axeResults = await new AxePuppeteer(page).analyze();
    const customChecks = await runCustomValidations(page);
    const runtime = {
      durationMs: Date.now() - startedAt,
      pageUrl: page.url(),
    };
    const results = buildAccessibleResults({
      url: analysis.url,
      axeResults,
      customChecks,
      analyzedAt: new Date().toISOString(),
      runtime,
    });

    await repository.updateAnalysis(analysis.id, {
      status: 'completed',
      score: results.score.value,
      results,
      meta: {
        stage: 'completed',
        statusMessage: 'Analise concluida com sucesso.',
        queue: queue.getQueueStats(),
      },
    });
  } catch (error) {
    const classified = classifyError(error);

    await repository.updateAnalysis(analysis.id, {
      status: 'error',
      meta: {
        stage: 'error',
        statusMessage: classified.userMessage,
        errorType: classified.type,
        queue: queue.getQueueStats(),
      },
      results: {
        error: classified.userMessage,
        details: error.message,
      },
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function createAnalysis(url) {
  const validationError = validateUrl(url);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  const analysis = await repository.createAnalysis({
    url,
    status: 'processing',
    meta: {
      stage: 'queued',
      statusMessage: 'Analise recebida e aguardando processamento.',
    },
  });

  queue.enqueue(async () => {
    await runSingleAnalysis(analysis);
  });

  return repository.updateAnalysis(analysis.id, {
    meta: {
      queue: queue.getQueueStats(),
    },
  });
}

async function listAnalyses() {
  return repository.listAnalyses();
}

async function getAnalysisById(id) {
  return repository.getAnalysisById(id);
}

async function deleteAnalysis(id) {
  return repository.deleteAnalysis(id);
}

function getRuntimeStats() {
  return queue.getQueueStats();
}

module.exports = {
  createAnalysis,
  deleteAnalysis,
  getAnalysisById,
  getRuntimeStats,
  listAnalyses,
};
