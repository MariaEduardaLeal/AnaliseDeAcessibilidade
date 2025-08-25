document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-analysis-form');
    const urlInput = document.getElementById('url-input');
    const analyzeButton = document.getElementById('analyze-button');
    const tableContainer = document.getElementById('analyses-table-container');

    const API_URL = 'http://localhost:3000/api/analyses';

    async function fetchAnalyses() {
        try {
            tableContainer.innerHTML = `
                <div class="text-center py-12 text-muted-foreground">
                    <div class="animate-spin rounded-full h-8 w-8 border-4 border-t-4 border-blue-500 mx-auto mb-4"></div>
                    <p>Carregando análises...</p>
                </div>
            `;
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Erro ao carregar análises da API');
            }
            const analyses = await response.json();
            renderTable(analyses);
        } catch (error) {
            console.error('Erro:', error);
            tableContainer.innerHTML = `
                <div class="text-center py-12 text-red-500">
                    <p>Ocorreu um erro ao conectar com o servidor. Por favor, verifique se o backend está rodando.</p>
                </div>
            `;
        }
    }

    function renderTable(analyses) {
        if (analyses.length === 0) {
            tableContainer.innerHTML = `
                <div class="text-center py-12 text-muted-foreground">
                    <p class="text-lg">Nenhuma análise encontrada. Comece agora!</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <div class="bg-white rounded-lg border overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b dark:bg-gray-700 dark:border-gray-600">
                            <tr>
                                <th class="text-left py-4 px-6 font-bold text-gray-900 dark:text-white">URL</th>
                                <th class="text-center py-4 px-6 font-bold text-gray-900 dark:text-white">Data da Análise</th>
                                <th class="text-center py-4 px-6 font-bold text-gray-900 dark:text-white">Status</th>
                                <th class="text-center py-4 px-6 font-bold text-gray-900 dark:text-white">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-600">
                            ${analyses.map(analysis => `
                                <tr class="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700">
                                    <td class="py-4 px-6">
                                        <a href="#" class="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-xs dark:text-blue-400 dark:hover:text-blue-200" title="${analysis.url}">
                                            ${truncateUrl(analysis.url)}
                                        </a>
                                    </td>
                                    <td class="py-4 px-6 text-center text-gray-600 dark:text-gray-400">
                                        ${formatDate(analysis.createdAt)}
                                    </td>
                                    <td class="py-4 px-6 text-center">
                                        ${getStatusBadge(analysis.status)}
                                    </td>
                                    <td class="py-4 px-6 text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            ${analysis.status === 'completed' ? `
                                                <button
                                                    onclick="window.location.href='report.html?id=${analysis.id}'"
                                                    class="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                                                >
                                                    Ver Relatório
                                                </button>
                                            ` : ''}
                                            <button
                                                onclick="deleteAnalysis('${analysis.id}')"
                                                class="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        tableContainer.innerHTML = tableHTML;
    }

    function truncateUrl(url, maxLength = 50) {
        return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function getStatusBadge(status) {
        const baseClasses = "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium";
        switch (status) {
            case 'processing':
                return `<span class="${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0014.015 1H12a3 3 0 00-3 3v4.582m6.115 5.394A8.001 8.001 0 0110.015 23H12a3 3 0 003-3v-4.582m-6.115-5.394A8.001 8.001 0 0114.015 1H12a3 3 0 003-3v4.582m-6.115-5.394A8.001 8.001 0 0110.015 23H12a3 3 0 003-3v-4.582m-6.115-5.394A8.001 8.001 0 0110.015 23H12a3 3 0 003-3v-4.582M4 4v5h.582m15.356 2A8.001 8.001 0 0014.015 1H12a3 3 0 00-3 3v4.582m6.115 5.394A8.001 8.001 0 0110.015 23H12a3 3 0 003-3v-4.582m-6.115-5.394A8.001 8.001 0 0114.015 1H12a3 3 0 003-3v4.582m-6.115-5.394A8.001 8.001 0 0110.015 23H12a3 3 0 003-3v-4.582" />
                            Processando
                        </span>`;
            case 'completed':
                return `<span class="${baseClasses} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                            Concluído
                        </span>`;
            case 'error':
                return `<span class="${baseClasses} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                            <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM10 5a1 1 0 011 1v4a1 1 0 01-2 0V6a1 1 0 011-1zm0 8a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" /></svg>
                            Erro
                        </span>`;
            default:
                return `<span class="${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">Desconhecido</span>`;
        }
    }

    async function handleFormSubmission(event) {
        event.preventDefault();
        const url = urlInput.value.trim();

        analyzeButton.textContent = 'Analisando...';
        analyzeButton.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao iniciar análise');
            }

            // O backend retorna a nova análise criada, adicionamos ela na lista
            // e renderizamos a tabela novamente.
            fetchAnalyses();

            urlInput.value = '';
            urlInput.classList.remove('border-red-300', 'border-green-300');
            
        } catch (error) {
            console.error('Erro:', error);
            alert(`Erro: ${error.message}`);
            urlInput.classList.remove('border-green-300');
            urlInput.classList.add('border-red-300');
        } finally {
            analyzeButton.textContent = 'Analisar';
            analyzeButton.disabled = false;
        }
    }

    // Função global para deletar uma análise
    window.deleteAnalysis = async (id) => {
        if (!confirm('Tem certeza que deseja deletar esta análise?')) {
            return;
        }
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao deletar análise');
            }

            alert('Análise deletada com sucesso!');
            fetchAnalyses(); // Recarrega a tabela após a exclusão
        } catch (error) {
            console.error('Erro:', error);
            alert(`Erro: ${error.message}`);
        }
    };

    form.addEventListener('submit', handleFormSubmission);
    urlInput.addEventListener('input', () => {
        try {
            new URL(urlInput.value);
            urlInput.classList.remove('border-red-300');
            urlInput.classList.add('border-green-300');
        } catch (_) {
            urlInput.classList.remove('border-green-300');
            if (urlInput.value.length > 0) {
                urlInput.classList.add('border-red-300');
            } else {
                urlInput.classList.remove('border-red-300');
            }
        }
    });

    // Inicia o carregamento das análises
    fetchAnalyses();

    // Simulação de polling para atualizar análises em processamento
    setInterval(() => {
        fetchAnalyses();
    }, 5000);
});