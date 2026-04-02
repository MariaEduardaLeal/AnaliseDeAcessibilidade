document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('url-analysis-form');
  const urlInput = document.getElementById('url-input');
  const analyzeButton = document.getElementById('analyze-button');
  const tableContainer = document.getElementById('analyses-table-container');
  const summaryContainer = document.getElementById('dashboard-summary');
  const feedbackPanel = document.getElementById('form-feedback');

  const {
    createAnalysis,
    getRuntimeStats,
    listAnalyses,
    removeAnalysis,
  } = window.AccessibilityApi;
  const {
    renderDashboardAnalyses,
    renderDashboardError,
    renderDashboardLoading,
    renderDashboardSummary,
  } = window.AccessibilityDashboardView;

  let pollingHandle;

  function setFeedback(message, tone = 'neutral') {
    feedbackPanel.className = `feedback-panel feedback-${tone}`;
    feedbackPanel.textContent = message;
    feedbackPanel.classList.remove('hidden');
  }

  function hideFeedback() {
    feedbackPanel.classList.add('hidden');
    feedbackPanel.textContent = '';
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Deseja realmente excluir esta analise?');
    if (!confirmed) {
      return;
    }

    try {
      await removeAnalysis(id);
      setFeedback('Analise excluida com sucesso.', 'success');
      await fetchAndRenderAnalyses();
    } catch (error) {
      setFeedback(error.message, 'error');
    }
  }

  async function fetchAndRenderAnalyses() {
    try {
      const [analyses, runtimeStats] = await Promise.all([
        listAnalyses(),
        getRuntimeStats().catch(() => null),
      ]);

      renderDashboardSummary(summaryContainer, analyses, runtimeStats);
      renderDashboardAnalyses(tableContainer, analyses, handleDelete);
    } catch (error) {
      renderDashboardError(summaryContainer, tableContainer, error.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    hideFeedback();

    const url = urlInput.value.trim();
    if (!url) {
      setFeedback('Informe uma URL para iniciar a analise.', 'error');
      return;
    }

    analyzeButton.disabled = true;
    analyzeButton.textContent = 'Iniciando analise...';

    try {
      await createAnalysis(url);
      urlInput.value = '';
      setFeedback('Analise iniciada. O status sera atualizado automaticamente.', 'success');
      await fetchAndRenderAnalyses();
    } catch (error) {
      setFeedback(error.message, 'error');
    } finally {
      analyzeButton.disabled = false;
      analyzeButton.textContent = 'Iniciar analise';
    }
  }

  form.addEventListener('submit', handleSubmit);
  urlInput.addEventListener('input', () => {
    if (!urlInput.value.trim()) {
      hideFeedback();
    }
  });

  renderDashboardLoading(summaryContainer, tableContainer);
  fetchAndRenderAnalyses();
  pollingHandle = window.setInterval(fetchAndRenderAnalyses, 5000);

  window.addEventListener('beforeunload', () => {
    if (pollingHandle) {
      window.clearInterval(pollingHandle);
    }
  });
});
