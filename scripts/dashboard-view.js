(() => {
  const {
    escapeHtml,
    formatDate,
    getScoreMeta,
    getStatusBadge,
    getStatusMeta,
    truncateUrl,
  } = window.AccessibilityUi;

  function renderDashboardLoading(summaryContainer, tableContainer) {
    summaryContainer.innerHTML = Array.from({ length: 4 }).map(() => `
      <article class="summary-card">
        <h3>Carregando</h3>
        <strong>...</strong>
        <p>Atualizando dados das analises.</p>
      </article>
    `).join('');

    tableContainer.innerHTML = `
      <div class="state-panel">
        <div class="loading-orb" aria-hidden="true"></div>
        <h2>Buscando analises</h2>
        <p>Carregando a lista mais recente.</p>
      </div>
    `;
  }

  function renderDashboardSummary(summaryContainer, analyses, runtimeStats) {
    const completed = analyses.filter((analysis) => analysis.status === 'completed');
    const processing = analyses.filter((analysis) => analysis.status === 'processing');
    const error = analyses.filter((analysis) => analysis.status === 'error');
    const averageScore = completed.length
      ? Math.round(completed.reduce((sum, analysis) => sum + (analysis.score || 0), 0) / completed.length)
      : 0;
    const scoreMeta = getScoreMeta(averageScore);

    const cards = [
      {
        title: 'Total de analises',
        value: analyses.length,
        description: 'Historico disponivel na plataforma.',
      },
      {
        title: 'Em processamento',
        value: processing.length,
        description: runtimeStats ? `${runtimeStats.activeCount} ativa(s) e ${runtimeStats.pendingCount} na fila.` : 'Paginas aguardando resultado final.',
      },
      {
        title: 'Com erro',
        value: error.length,
        description: 'Analises que exigem nova tentativa.',
      },
      {
        title: 'Score medio',
        value: `${averageScore}/100`,
        description: completed.length ? `Media das ${completed.length} analises concluidas.` : 'Ainda nao ha analises concluidas.',
        toneClass: scoreMeta.tone,
      },
    ];

    summaryContainer.innerHTML = cards.map((card) => `
      <article class="summary-card ${card.toneClass || ''}">
        <h3>${card.title}</h3>
        <strong>${card.value}</strong>
        <p>${card.description}</p>
      </article>
    `).join('');
  }

  function renderDashboardError(summaryContainer, tableContainer, message) {
    summaryContainer.innerHTML = `
      <article class="summary-card">
        <h3>Sem dados</h3>
        <strong>--</strong>
        <p>O backend nao respondeu como esperado.</p>
      </article>
    `;

    tableContainer.innerHTML = `
      <div class="state-panel">
        <h2>Falha ao carregar analises</h2>
        <p>${escapeHtml(message)} Verifique se o backend esta em execucao.</p>
      </div>
    `;
  }

  function renderDashboardAnalyses(tableContainer, analyses, onDelete) {
    if (!analyses.length) {
      tableContainer.innerHTML = `
        <div class="dashboard-empty">
          <h3>Nenhuma analise cadastrada ainda</h3>
          <p>Comece pela URL acima para gerar o primeiro relatorio.</p>
        </div>
      `;
      return;
    }

    tableContainer.innerHTML = `
      <div class="analysis-list">
        ${analyses.map((analysis) => {
          const status = getStatusMeta(analysis.status);
          const canOpen = analysis.status === 'completed';
          const scoreLabel = typeof analysis.score === 'number' ? `${analysis.score}/100` : 'Aguardando';
          const statusDetail = analysis.meta?.statusMessage || status.description;

          return `
            <article class="analysis-list-card">
              <div class="space-y-2">
                <p class="analysis-url">${escapeHtml(truncateUrl(analysis.url, 72))}</p>
                <p class="analysis-meta">Criada em ${formatDate(analysis.createdAt)}</p>
              </div>
              <div class="space-y-2">
                <span class="eyebrow">Score</span>
                <p><strong>${scoreLabel}</strong></p>
              </div>
              <div class="space-y-2">
                <span class="eyebrow">Status</span>
                <div>${getStatusBadge(analysis.status)}</div>
                <p class="analysis-meta">${escapeHtml(statusDetail)}</p>
              </div>
              <div class="analysis-actions">
                ${canOpen ? `<a class="secondary-button" href="report.html?id=${analysis.id}">Ver relatorio</a>` : ''}
                <button type="button" class="ghost-button" data-delete-id="${analysis.id}">Excluir</button>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;

    tableContainer.querySelectorAll('[data-delete-id]').forEach((button) => {
      button.addEventListener('click', () => onDelete(button.dataset.deleteId));
    });
  }

  window.AccessibilityDashboardView = {
    renderDashboardAnalyses,
    renderDashboardError,
    renderDashboardLoading,
    renderDashboardSummary,
  };
})();
