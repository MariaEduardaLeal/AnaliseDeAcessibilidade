(() => {
  const {
    escapeHtml,
    formatDate,
    getScoreMeta,
    getSeverityMeta,
    getStatusBadge,
  } = window.AccessibilityUi;

  function mapLegacySeverity(impact, type) {
    if (type === 'incomplete') return 'medium';
    if (impact === 'critical') return 'critical';
    if (impact === 'serious') return 'high';
    if (impact === 'minor') return 'low';
    return 'medium';
  }

  function normalizeLegacyResults(results, analysisScore) {
    const violations = Array.isArray(results?.violations) ? results.violations : [];
    const incomplete = Array.isArray(results?.incomplete) ? results.incomplete : [];
    const issues = [...violations, ...incomplete].map((issue) => {
      const type = violations.includes(issue) ? 'violation' : 'incomplete';
      const severity = mapLegacySeverity(issue.impact, type);

      return {
        id: issue.id,
        source: 'axe',
        category: 'Outros',
        ruleType: type,
        severity,
        priority: severity === 'critical' ? 'Corrigir primeiro' : 'Planejar correcao',
        title: issue.help || 'Problema de acessibilidade identificado',
        description: issue.description || 'A ferramenta encontrou um problema que pode prejudicar a navegacao.',
        whyItMatters: severity === 'critical'
          ? 'Esse problema pode bloquear ou comprometer bastante o uso da pagina.'
          : severity === 'high'
            ? 'Esse problema cria uma barreira relevante para parte dos usuarios.'
            : severity === 'medium'
              ? 'Esse problema dificulta a compreensao ou a interacao em partes da experiencia.'
              : 'Esse problema tem impacto menor, mas vale ajustar para deixar a interface mais consistente.',
        suggestion: issue.help
          ? `${issue.help}. Revise o elemento afetado e aplique a correcao recomendada.`
          : 'Revise o elemento afetado e ajuste a marcacao para melhorar a acessibilidade.',
        helpUrl: issue.helpUrl || null,
        occurrences: Array.isArray(issue.nodes) ? issue.nodes.length : 0,
        elements: (issue.nodes || []).slice(0, 5).map((node) => ({
          target: Array.isArray(node.target) ? node.target.join(', ') : '',
          html: node.html || '',
          summary: (node.failureSummary || '').replace(/\s+/g, ' ').trim(),
        })),
      };
    });

    const groupedIssues = {
      critical: issues.filter((issue) => issue.severity === 'critical'),
      high: issues.filter((issue) => issue.severity === 'high'),
      medium: issues.filter((issue) => issue.severity === 'medium'),
      low: issues.filter((issue) => issue.severity === 'low'),
    };

    return {
      page: { title: '' },
      score: {
        value: typeof analysisScore === 'number' ? analysisScore : 0,
        label: 'Sem score estruturado',
      },
      summary: {
        totalIssues: issues.length,
        critical: groupedIssues.critical.length,
        high: groupedIssues.high.length,
        medium: groupedIssues.medium.length,
        low: groupedIssues.low.length,
        automatedChecksPassed: Array.isArray(results?.passes) ? results.passes.length : 0,
        needsReview: incomplete.length,
        topPriorities: issues.slice(0, 3).map((issue) => ({
          title: issue.title,
          severity: issue.severity,
          category: issue.category,
        })),
      },
      issues,
      groupedIssues,
      groupedByCategory: {},
    };
  }

  function normalizeAnalysis(analysis) {
    const structuredResults = analysis.results?.summary && analysis.results?.issues
      ? analysis.results
      : normalizeLegacyResults(analysis.results || {}, analysis.score);

    const scoreValue = typeof analysis.score === 'number'
      ? analysis.score
      : structuredResults.score?.value || 0;

    return {
      ...analysis,
      normalizedResults: {
        ...structuredResults,
        score: {
          ...structuredResults.score,
          value: scoreValue,
        },
      },
    };
  }

  function renderScoreRing(score) {
    const scoreMeta = getScoreMeta(score);
    const colorMap = {
      'score-excellent': '#15803d',
      'score-good': '#22c55e',
      'score-warning': '#d97706',
      'score-critical': '#dc2626',
    };
    const strokeColor = colorMap[scoreMeta.tone] || '#22c55e';
    const circumference = 2 * Math.PI * 86;
    const offset = circumference - (score / 100) * circumference;

    return `
      <div class="score-ring">
        <svg viewBox="0 0 200 200" width="210" height="210" aria-hidden="true">
          <circle cx="100" cy="100" r="86" stroke="#efe5d8" stroke-width="16" fill="none"></circle>
          <circle
            cx="100"
            cy="100"
            r="86"
            stroke="${strokeColor}"
            stroke-width="16"
            fill="none"
            stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
          ></circle>
        </svg>
        <div class="score-ring-center">
          <strong class="score-ring-value">${score}</strong>
          <span class="score-ring-scale">de 100</span>
          <span class="status-pill ${scoreMeta.tone}" style="margin-top:10px;">${scoreMeta.label}</span>
        </div>
      </div>
    `;
  }

  function renderKpis(results, analysis) {
    const cards = [
      {
        title: 'Problemas totais',
        value: results.summary.totalIssues,
        description: 'Itens que merecem atencao no relatorio.',
      },
      {
        title: 'Checks aprovados',
        value: results.summary.automatedChecksPassed,
        description: 'Validacoes automatizadas que passaram.',
      },
      {
        title: 'Revisao manual',
        value: results.summary.needsReview,
        description: 'Itens que exigem checagem humana complementar.',
      },
      {
        title: 'Ultima atualizacao',
        value: formatDate(analysis.updatedAt),
        description: 'Momento em que a analise foi registrada.',
      },
    ];

    return `
      <div class="kpi-grid">
        ${cards.map((card) => `
          <article class="kpi-card">
            <p class="eyebrow">${card.title}</p>
            <strong>${escapeHtml(card.value)}</strong>
            <p class="muted-copy">${card.description}</p>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderPriorityList(results) {
    const priorities = results.summary.topPriorities || [];
    if (!priorities.length) {
      return '<p class="muted-copy">Nenhum item prioritario identificado.</p>';
    }

    return `
      <div class="priority-list">
        ${priorities.map((item, index) => {
          const meta = getSeverityMeta(item.severity);
          return `
            <article class="priority-item">
              <span class="priority-order">0${index + 1}</span>
              <div>
                <h3>${escapeHtml(item.title)}</h3>
                <p class="muted-copy">${escapeHtml(item.category)}</p>
              </div>
              <span class="severity-pill ${meta.tone}">${meta.label}</span>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderIssue(issue) {
    const severity = getSeverityMeta(issue.severity);
    const element = issue.elements?.[0];

    return `
      <article class="issue-card">
        <div class="issue-card-header">
          <div class="space-y-2">
            <h4>${escapeHtml(issue.title)}</h4>
            <div class="issue-meta">
              <span class="severity-pill ${severity.tone}">${severity.label}</span>
              <span class="status-pill status-neutral">${escapeHtml(issue.category || 'Outros')}</span>
              <span class="status-pill status-neutral">${issue.occurrences || 1} ocorrencia(s)</span>
            </div>
          </div>
        </div>
        <div class="issue-detail">
          <strong>O que foi encontrado</strong>
          <p>${escapeHtml(issue.description)}</p>
        </div>
        <div class="issue-detail">
          <strong>Impacto para o usuario</strong>
          <p>${escapeHtml(issue.whyItMatters)}</p>
        </div>
        <div class="issue-detail">
          <strong>Prioridade de acao</strong>
          <p>${escapeHtml(issue.priority || 'Planejar correcao')}</p>
        </div>
        <div class="issue-detail">
          <strong>Como corrigir</strong>
          <p>${escapeHtml(issue.suggestion)}</p>
        </div>
        ${element ? `
          <div class="issue-detail">
            <strong>Exemplo de elemento afetado</strong>
            <div class="code-block">
              <code>${escapeHtml(element.html || element.target || 'Nao informado')}</code>
            </div>
            ${element.summary ? `<p class="muted-copy">${escapeHtml(element.summary)}</p>` : ''}
          </div>
        ` : ''}
        ${issue.helpUrl ? `
          <div class="inline-actions">
            <a class="secondary-button" href="${escapeHtml(issue.helpUrl)}" target="_blank" rel="noreferrer">Abrir documentacao</a>
          </div>
        ` : ''}
      </article>
    `;
  }

  function renderSeverityColumn(title, severity, issues) {
    const severityMeta = getSeverityMeta(severity);

    return `
      <section class="severity-column">
        <div class="severity-column-header">
          <div>
            <p class="eyebrow">${title}</p>
            <h3>${issues.length} item(ns)</h3>
          </div>
          <span class="severity-pill ${severityMeta.tone}">${severityMeta.label}</span>
        </div>
        ${issues.length
          ? issues.map(renderIssue).join('')
          : `<div class="empty-column">Nenhum problema ${title.toLowerCase()} encontrado nesta analise.</div>`}
      </section>
    `;
  }

  function renderCategoryOverview(results) {
    const entries = Object.entries(results.groupedByCategory || {}).sort((left, right) => right[1].length - left[1].length);

    if (!entries.length) {
      return '<p class="muted-copy">Nao ha categorias disponiveis para esta analise.</p>';
    }

    return `
      <div class="category-grid">
        ${entries.map(([category, issues]) => `
          <article class="kpi-card">
            <p class="eyebrow">${escapeHtml(category)}</p>
            <strong>${issues.length}</strong>
            <p class="muted-copy">Problema(s) concentrados nesta categoria.</p>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderReport(container, analysis) {
    const normalized = normalizeAnalysis(analysis);
    const results = normalized.normalizedResults;
    const pageTitle = results.page?.title ? `Pagina analisada: ${results.page.title}` : 'Pagina analisada';
    const runtimeText = results.runtime?.durationMs ? `Tempo de execucao: ${Math.round(results.runtime.durationMs / 1000)}s.` : '';

    container.innerHTML = `
      <div class="report-overview">
        <section class="report-card report-hero">
          <div class="report-headline">
            <div>
              <p class="eyebrow">Resumo geral</p>
              <h2 class="report-title">${escapeHtml(normalized.url)}</h2>
              <p class="report-subtitle">${escapeHtml(pageTitle)}</p>
            </div>
            <div class="inline-actions">
              ${getStatusBadge(normalized.status)}
              <span class="status-pill status-neutral">Criada em ${formatDate(normalized.createdAt)}</span>
            </div>
            <p class="muted-copy">
              O score combina severidade, recorrencia e tipo de problema para refletir melhor a experiencia real.
              ${escapeHtml(runtimeText)}
            </p>
          </div>
          <div class="score-panel">
            ${renderScoreRing(results.score.value)}
          </div>
        </section>

        <section class="report-card">
          ${renderKpis(results, normalized)}
        </section>

        <section class="report-card">
          <div class="section-heading">
            <p class="eyebrow">Prioridades</p>
            <h2>O que corrigir primeiro</h2>
            <p>Comece pelos problemas de maior impacto e maior frequencia para acelerar o ganho de acessibilidade.</p>
          </div>
          <div style="margin-top:24px;">
            ${renderPriorityList(results)}
          </div>
        </section>

        <section class="report-card">
          <div class="section-heading">
            <p class="eyebrow">Categorias</p>
            <h2>Problemas agrupados por tipo</h2>
            <p>Essa visao ajuda a distribuir o trabalho entre design, frontend e conteudo.</p>
          </div>
          <div style="margin-top:24px;">
            ${renderCategoryOverview(results)}
          </div>
        </section>

        <section class="report-card">
          <div class="section-heading">
            <p class="eyebrow">Prioridades por severidade</p>
            <h2>Problemas organizados por impacto</h2>
            <p>Resolva primeiro os itens criticos e altos, depois avance para medios e baixos.</p>
          </div>
          <div class="severity-grid" style="margin-top:24px;">
            ${renderSeverityColumn('Problemas criticos', 'critical', results.groupedIssues.critical || [])}
            ${renderSeverityColumn('Problemas altos', 'high', results.groupedIssues.high || [])}
            ${renderSeverityColumn('Problemas medios', 'medium', results.groupedIssues.medium || [])}
            ${renderSeverityColumn('Problemas baixos', 'low', results.groupedIssues.low || [])}
          </div>
        </section>
      </div>
    `;
  }

  function renderState(container, title, description, tone = 'neutral') {
    container.innerHTML = `
      <section class="state-panel ${tone === 'error' ? 'feedback-error' : ''}">
        ${tone === 'loading' ? '<div class="loading-orb" aria-hidden="true"></div>' : ''}
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
        <div class="inline-actions" style="justify-content:center; margin-top:16px;">
          <a class="secondary-button" href="index.html">Voltar ao dashboard</a>
        </div>
      </section>
    `;
  }

  window.AccessibilityReportView = {
    normalizeAnalysis,
    renderReport,
    renderState,
  };
})();
