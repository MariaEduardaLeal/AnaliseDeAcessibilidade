(() => {
  function formatDate(dateString) {
    if (!dateString) {
      return 'Nao informado';
    }

    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function truncateUrl(url, maxLength = 52) {
    if (!url) return '';
    return url.length > maxLength ? `${url.slice(0, maxLength)}...` : url;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getStatusMeta(status) {
    const map = {
      processing: {
        label: 'Processando',
        tone: 'status-processing',
        description: 'A coleta ainda esta em andamento.',
      },
      completed: {
        label: 'Concluida',
        tone: 'status-completed',
        description: 'Resultado pronto para consulta.',
      },
      error: {
        label: 'Erro',
        tone: 'status-error',
        description: 'A pagina nao pode ser analisada.',
      },
    };

    return map[status] || {
      label: 'Desconhecido',
      tone: 'status-neutral',
      description: 'Estado nao mapeado.',
    };
  }

  function getStatusBadge(status) {
    const meta = getStatusMeta(status);
    return `<span class="status-pill ${meta.tone}">${meta.label}</span>`;
  }

  function getSeverityMeta(severity) {
    const map = {
      critical: {
        label: 'Critico',
        tone: 'severity-critical',
      },
      high: {
        label: 'Alto',
        tone: 'severity-high',
      },
      medium: {
        label: 'Medio',
        tone: 'severity-medium',
      },
      low: {
        label: 'Leve',
        tone: 'severity-low',
      },
    };

    return map[severity] || map.medium;
  }

  function getScoreMeta(score) {
    if (score >= 90) {
      return { label: 'Excelente', tone: 'score-excellent' };
    }
    if (score >= 75) {
      return { label: 'Boa', tone: 'score-good' };
    }
    if (score >= 55) {
      return { label: 'Atencao', tone: 'score-warning' };
    }
    return { label: 'Critica', tone: 'score-critical' };
  }

  window.AccessibilityUi = {
    escapeHtml,
    formatDate,
    getScoreMeta,
    getSeverityMeta,
    getStatusBadge,
    getStatusMeta,
    truncateUrl,
  };
})();
