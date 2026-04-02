const SEVERITY_LEVELS = {
  critical: { rank: 4, basePenalty: 30, occurrencePenalty: 8 },
  high: { rank: 3, basePenalty: 18, occurrencePenalty: 5 },
  medium: { rank: 2, basePenalty: 10, occurrencePenalty: 3 },
  low: { rank: 1, basePenalty: 4, occurrencePenalty: 1.5 },
};

const AXE_IMPACT_TO_SEVERITY = {
  critical: 'critical',
  serious: 'high',
  moderate: 'medium',
  minor: 'low',
};

const CATEGORY_KEYWORDS = [
  { match: ['color', 'contrast'], label: 'Contraste' },
  { match: ['label', 'form', 'input'], label: 'Formulario' },
  { match: ['button', 'link', 'name'], label: 'Navegacao e controles' },
  { match: ['heading', 'landmark', 'region', 'page-has-heading-one', 'document-title'], label: 'Estrutura da pagina' },
  { match: ['image', 'alt'], label: 'Imagem e midia' },
  { match: ['table', 'th-'], label: 'Tabelas' },
  { match: ['aria'], label: 'ARIA' },
];

const CUSTOM_RULES = {
  'image-alt-missing': {
    title: 'Imagem sem texto alternativo',
    description: 'Foi encontrada imagem visivel sem texto alternativo.',
    whyItMatters: 'Pessoas que usam leitor de tela nao recebem explicacao sobre o conteudo da imagem.',
    suggestion: 'Adicione um atributo alt que descreva a imagem. Se a imagem for apenas decorativa, use alt vazio.',
    severity: 'critical',
    category: 'Imagem e midia',
  },
  'image-alt-generic': {
    title: 'Texto alternativo pouco descritivo',
    description: 'Algumas imagens usam alt generico, como "imagem" ou nome de arquivo.',
    whyItMatters: 'Um alt generico informa pouco e nao ajuda quem depende de tecnologias assistivas a entender o conteudo.',
    suggestion: 'Troque o alt por uma descricao curta e objetiva do que a imagem comunica.',
    severity: 'medium',
    category: 'Imagem e midia',
  },
  'input-label-missing': {
    title: 'Campo de formulario sem rotulo claro',
    description: 'Ha campos sem label associado ou sem nome acessivel equivalente.',
    whyItMatters: 'Usuarios podem nao entender qual informacao precisa ser preenchida ou como focar o campo por voz.',
    suggestion: 'Associe um <label> ao campo ou forneca aria-label/aria-labelledby quando necessario.',
    severity: 'critical',
    category: 'Formulario',
  },
  'button-name-missing': {
    title: 'Botao sem nome acessivel',
    description: 'Existe botao visivel sem texto ou nome acessivel claro.',
    whyItMatters: 'Sem um nome claro, a acao do botao fica ambigua para leitor de tela, voz e navegacao por lista de controles.',
    suggestion: 'Inclua texto visivel ou defina aria-label/aria-labelledby com descricao objetiva da acao.',
    severity: 'critical',
    category: 'Navegacao e controles',
  },
  'heading-structure': {
    title: 'Hierarquia de titulos inconsistente',
    description: 'A ordem dos headings pula niveis e dificulta a leitura estrutural da pagina.',
    whyItMatters: 'Titulos ajudam a entender rapidamente secoes e prioridade do conteudo, especialmente em leitores de tela.',
    suggestion: 'Reorganize os headings para seguir ordem logica, evitando saltos como h1 para h3 sem um h2 entre eles.',
    severity: 'medium',
    category: 'Estrutura da pagina',
  },
  'landmarks-missing': {
    title: 'Landmarks principais ausentes',
    description: 'A pagina nao expoe landmarks essenciais como main, header ou nav.',
    whyItMatters: 'Landmarks permitem que usuarios saltem rapidamente entre regioes importantes da pagina.',
    suggestion: 'Use elementos semanticos como <main>, <header>, <nav> e <footer> para estruturar a navegacao.',
    severity: 'high',
    category: 'Estrutura da pagina',
  },
  'page-title-missing': {
    title: 'Titulo da pagina ausente',
    description: 'A pagina nao possui um titulo significativo no documento.',
    whyItMatters: 'O titulo e usado por leitores de tela, historico do navegador e abas para identificar a pagina.',
    suggestion: 'Defina um <title> claro e especifico para a pagina.',
    severity: 'high',
    category: 'Estrutura da pagina',
  },
};

function normalizeText(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function inferCategory(id, tags = []) {
  const haystack = `${id} ${tags.join(' ')}`.toLowerCase();
  const match = CATEGORY_KEYWORDS.find((entry) => entry.match.some((keyword) => haystack.includes(keyword)));
  return match ? match.label : 'Outros';
}

function getSeverityFromAxe(issue, type) {
  if (type === 'incomplete') {
    return 'medium';
  }

  return AXE_IMPACT_TO_SEVERITY[issue.impact] || 'medium';
}

function getPriorityText(severity) {
  if (severity === 'critical') return 'Corrigir primeiro';
  if (severity === 'high') return 'Alta prioridade';
  if (severity === 'medium') return 'Planejar correcao';
  return 'Ajuste incremental';
}

function inferSimpleWhyItMatters(severity) {
  if (severity === 'critical') {
    return 'Esse problema pode bloquear ou comprometer diretamente tarefas importantes para parte dos usuarios.';
  }
  if (severity === 'high') {
    return 'Esse problema causa barreira forte e pode gerar abandono ou erros durante a navegacao.';
  }
  if (severity === 'medium') {
    return 'Esse problema gera atrito e reduz a clareza da experiencia, mesmo que a tarefa ainda possa ser concluida.';
  }
  return 'Esse problema tem impacto menor isoladamente, mas afeta consistencia e qualidade ao longo da experiencia.';
}

function inferSimpleSuggestion(issue) {
  if (issue.help) {
    return `${issue.help}. Revise o componente afetado e ajuste HTML, semantica ou atributos de acessibilidade.`;
  }

  return 'Revise o elemento afetado e ajuste a marcacao para oferecer nome acessivel, estrutura e semantica adequados.';
}

function summarizeNode(node) {
  return {
    target: Array.isArray(node.target) ? node.target.join(', ') : '',
    html: node.html || '',
    summary: normalizeText(node.failureSummary || ''),
  };
}

function mapAxeIssue(issue, type) {
  const severity = getSeverityFromAxe(issue, type);
  const nodes = Array.isArray(issue.nodes) ? issue.nodes : [];

  return {
    id: issue.id,
    source: 'axe',
    category: inferCategory(issue.id, issue.tags),
    ruleType: type,
    severity,
    priority: getPriorityText(severity),
    title: issue.help || 'Problema de acessibilidade identificado',
    description: issue.description || 'Foi encontrado um problema de acessibilidade durante a verificacao automatica.',
    whyItMatters: inferSimpleWhyItMatters(severity),
    suggestion: inferSimpleSuggestion(issue),
    helpUrl: issue.helpUrl || null,
    wcagTags: (issue.tags || []).filter((tag) => tag.startsWith('wcag')),
    occurrences: nodes.length,
    elements: nodes.slice(0, 5).map(summarizeNode),
  };
}

function buildCustomIssue(ruleId, occurrences) {
  const rule = CUSTOM_RULES[ruleId];

  return {
    id: ruleId,
    source: 'custom',
    category: rule.category,
    ruleType: 'custom',
    severity: rule.severity,
    priority: getPriorityText(rule.severity),
    title: rule.title,
    description: rule.description,
    whyItMatters: rule.whyItMatters,
    suggestion: rule.suggestion,
    helpUrl: null,
    wcagTags: [],
    occurrences: occurrences.length,
    elements: occurrences.slice(0, 5),
  };
}

function scoreIssue(issue) {
  const config = SEVERITY_LEVELS[issue.severity] || SEVERITY_LEVELS.medium;
  const repeatedOccurrences = Math.max(0, (issue.occurrences || 1) - 1);
  const cappedOccurrencePenalty = Math.min(repeatedOccurrences, 5) * config.occurrencePenalty;
  return config.basePenalty + cappedOccurrencePenalty;
}

function calculateScore(issues) {
  const totalPenalty = issues.reduce((sum, issue) => sum + scoreIssue(issue), 0);
  const normalizedPenalty = Math.round(100 * (1 - Math.exp(-totalPenalty / 90)));
  const value = Math.max(0, 100 - normalizedPenalty);

  return {
    value,
    totalPenalty,
    weights: SEVERITY_LEVELS,
  };
}

function groupBySeverity(issues) {
  return issues.reduce((accumulator, issue) => {
    accumulator[issue.severity].push(issue);
    return accumulator;
  }, {
    critical: [],
    high: [],
    medium: [],
    low: [],
  });
}

function groupByCategory(issues) {
  return issues.reduce((accumulator, issue) => {
    if (!accumulator[issue.category]) {
      accumulator[issue.category] = [];
    }

    accumulator[issue.category].push(issue);
    return accumulator;
  }, {});
}

async function runCustomValidations(page) {
  return page.evaluate(() => {
    const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const isHidden = (node) => {
      if (!node || node.hidden || node.getAttribute('aria-hidden') === 'true') {
        return true;
      }

      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return true;
      }

      return !node.offsetParent && style.position !== 'fixed';
    };

    const uniqueByKey = (items) => {
      const seen = new Set();
      return items.filter((item) => {
        const key = item.html || item.target;
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    };

    const serializeNode = (node, summary) => ({
      target: node.id ? `#${node.id}` : node.tagName.toLowerCase(),
      html: (node.outerHTML || '').slice(0, 240),
      summary,
    });

    const visibleImages = Array.from(document.querySelectorAll('img')).filter((node) => !isHidden(node));
    const imageAltMissing = uniqueByKey(
      visibleImages
        .filter((node) => !node.hasAttribute('alt') && node.getAttribute('role') !== 'presentation')
        .map((node) => serializeNode(node, 'A imagem nao possui atributo alt.'))
    );

    const imageAltGeneric = uniqueByKey(
      visibleImages
        .filter((node) => {
          const alt = normalize(node.getAttribute('alt'));
          if (!alt || alt === '') {
            return false;
          }

          const src = normalize(node.getAttribute('src')).toLowerCase();
          const suspiciousAlt = ['image', 'imagem', 'foto', 'picture', 'img'];
          return suspiciousAlt.includes(alt.toLowerCase()) || (src && alt.toLowerCase() === src.split('/').pop());
        })
        .map((node) => serializeNode(node, 'O texto alternativo e generico e pouco informativo.'))
    );

    const formControls = Array.from(document.querySelectorAll('input, select, textarea'))
      .filter((node) => !isHidden(node))
      .filter((node) => {
        if (node.tagName.toLowerCase() !== 'input') {
          return true;
        }

        const type = (node.getAttribute('type') || 'text').toLowerCase();
        return !['hidden', 'submit', 'reset', 'button', 'image'].includes(type);
      });

    const inputLabelMissing = uniqueByKey(
      formControls
        .filter((node) => {
          const labels = node.labels ? Array.from(node.labels) : [];
          const hasVisibleLabel = labels.some((label) => normalize(label.textContent).length > 0);
          const hasAriaLabel = normalize(node.getAttribute('aria-label')).length > 0;
          const hasAriaLabelledBy = normalize(node.getAttribute('aria-labelledby')).length > 0;
          const hasPlaceholderOnly = normalize(node.getAttribute('placeholder')).length > 0;
          return !hasVisibleLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasPlaceholderOnly;
        })
        .map((node) => serializeNode(node, 'O campo nao possui label associado nem nome acessivel claro.'))
    );

    const buttonCandidates = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"]'))
      .filter((node) => !isHidden(node));

    const buttonNameMissing = uniqueByKey(
      buttonCandidates
        .filter((node) => {
          const text = normalize(node.textContent || node.value || '');
          const ariaLabel = normalize(node.getAttribute('aria-label'));
          const ariaLabelledBy = normalize(node.getAttribute('aria-labelledby'));
          const title = normalize(node.getAttribute('title'));
          return !text && !ariaLabel && !ariaLabelledBy && !title;
        })
        .map((node) => serializeNode(node, 'O botao nao apresenta texto ou nome acessivel identificavel.'))
    );

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).filter((node) => !isHidden(node));
    const headingStructure = [];
    let previousLevel = 0;

    headings.forEach((heading) => {
      const currentLevel = Number(heading.tagName.substring(1));
      if (previousLevel && currentLevel > previousLevel + 1) {
        headingStructure.push(serializeNode(heading, `A hierarquia pulou de h${previousLevel} para h${currentLevel}.`));
      }
      previousLevel = currentLevel;
    });

    const landmarksMissing = [];
    if (!document.querySelector('main')) {
      landmarksMissing.push({ target: 'main', html: '<main>', summary: 'A pagina nao possui landmark principal.' });
    }
    if (!document.querySelector('nav')) {
      landmarksMissing.push({ target: 'nav', html: '<nav>', summary: 'A pagina nao possui landmark de navegacao.' });
    }
    if (!document.querySelector('header')) {
      landmarksMissing.push({ target: 'header', html: '<header>', summary: 'A pagina nao possui landmark de cabecalho.' });
    }

    const pageTitleMissing = normalize(document.title).length === 0
      ? [{ target: 'title', html: '<title>', summary: 'A pagina nao possui titulo definido.' }]
      : [];

    return {
      imageAltMissing,
      imageAltGeneric,
      inputLabelMissing,
      buttonNameMissing,
      headingStructure,
      landmarksMissing,
      pageTitleMissing,
      pageMeta: {
        title: document.title || '',
        readyState: document.readyState,
      },
    };
  });
}

function buildAccessibleResults({ url, axeResults, customChecks, analyzedAt, runtime }) {
  const issues = [
    ...(axeResults.violations || []).map((issue) => mapAxeIssue(issue, 'violation')),
    ...(axeResults.incomplete || []).map((issue) => mapAxeIssue(issue, 'incomplete')),
  ];

  [
    ['image-alt-missing', customChecks.imageAltMissing],
    ['image-alt-generic', customChecks.imageAltGeneric],
    ['input-label-missing', customChecks.inputLabelMissing],
    ['button-name-missing', customChecks.buttonNameMissing],
    ['heading-structure', customChecks.headingStructure],
    ['landmarks-missing', customChecks.landmarksMissing],
    ['page-title-missing', customChecks.pageTitleMissing],
  ].forEach(([ruleId, occurrences]) => {
    if (occurrences.length > 0) {
      issues.push(buildCustomIssue(ruleId, occurrences));
    }
  });

  const groupedIssues = groupBySeverity(issues);
  const groupedByCategory = groupByCategory(issues);
  const score = calculateScore(issues);
  const orderedIssues = [...issues].sort((left, right) => {
    const severityDelta = (SEVERITY_LEVELS[right.severity]?.rank || 0) - (SEVERITY_LEVELS[left.severity]?.rank || 0);
    if (severityDelta !== 0) {
      return severityDelta;
    }

    return (right.occurrences || 0) - (left.occurrences || 0);
  });

  return {
    analyzedAt,
    url,
    page: customChecks.pageMeta,
    runtime,
    score: {
      ...score,
      label: score.value >= 90 ? 'Excelente' : score.value >= 75 ? 'Boa' : score.value >= 55 ? 'Atencao' : 'Critica',
    },
    summary: {
      totalIssues: orderedIssues.length,
      critical: groupedIssues.critical.length,
      high: groupedIssues.high.length,
      medium: groupedIssues.medium.length,
      low: groupedIssues.low.length,
      automatedChecksPassed: (axeResults.passes || []).length,
      needsReview: (axeResults.incomplete || []).length,
      topPriorities: orderedIssues.slice(0, 3).map((issue) => ({
        title: issue.title,
        severity: issue.severity,
        category: issue.category,
      })),
    },
    issues: orderedIssues,
    groupedIssues,
    groupedByCategory,
    sourceSummary: {
      axeViolations: (axeResults.violations || []).length,
      axeIncomplete: (axeResults.incomplete || []).length,
      axePasses: (axeResults.passes || []).length,
      customChecksTriggered: orderedIssues.filter((issue) => issue.source === 'custom').length,
    },
  };
}

module.exports = {
  SEVERITY_LEVELS,
  buildAccessibleResults,
  runCustomValidations,
};
