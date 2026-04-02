document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loading-state');
  const reportContainer = document.getElementById('report-container');
  const analysisId = new URLSearchParams(window.location.search).get('id');

  const { getAnalysis } = window.AccessibilityApi;
  const { renderReport, renderState } = window.AccessibilityReportView;

  let pollingHandle;

  function showState(title, description, tone = 'neutral') {
    loadingState.classList.add('hidden');
    reportContainer.classList.remove('hidden');
    renderState(reportContainer, title, description, tone);
  }

  async function fetchReport() {
    if (!analysisId) {
      showState('Analise nao identificada', 'Informe um id valido na URL para abrir o relatorio.', 'error');
      return;
    }

    try {
      const analysis = await getAnalysis(analysisId);

      if (analysis.status === 'processing') {
        const statusMessage = analysis.meta?.statusMessage || 'A pagina ainda esta sendo processada. Esta tela atualiza automaticamente.';
        showState('Analise em andamento', statusMessage, 'loading');
        return;
      }

      if (analysis.status === 'error') {
        const message = analysis.results?.details || analysis.results?.error || analysis.meta?.statusMessage || 'Ocorreu uma falha ao carregar ou analisar a pagina.';
        if (pollingHandle) {
          window.clearInterval(pollingHandle);
        }
        showState('Nao foi possivel concluir a analise', message, 'error');
        return;
      }

      if (pollingHandle) {
        window.clearInterval(pollingHandle);
      }

      loadingState.classList.add('hidden');
      reportContainer.classList.remove('hidden');
      renderReport(reportContainer, analysis);
    } catch (error) {
      if (pollingHandle) {
        window.clearInterval(pollingHandle);
      }
      showState('Erro ao carregar relatorio', error.message, 'error');
    }
  }

  fetchReport();
  pollingHandle = window.setInterval(fetchReport, 5000);

  window.addEventListener('beforeunload', () => {
    if (pollingHandle) {
      window.clearInterval(pollingHandle);
    }
  });
});
