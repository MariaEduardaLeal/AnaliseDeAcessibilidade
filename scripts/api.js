(() => {
  const API_URL = '/api/analyses';

  async function parseResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Nao foi possivel concluir a solicitacao.');
    }

    return data;
  }

  async function request(path = '', options = {}) {
    const response = await fetch(`${API_URL}${path}`, options);
    return parseResponse(response);
  }

  window.AccessibilityApi = {
    API_URL,
    listAnalyses: () => request(),
    getAnalysis: (id) => request(`/${id}`),
    createAnalysis: (url) => request('', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }),
    removeAnalysis: (id) => request(`/${id}`, {
      method: 'DELETE',
    }),
    getRuntimeStats: () => request('/runtime/stats'),
  };
})();
