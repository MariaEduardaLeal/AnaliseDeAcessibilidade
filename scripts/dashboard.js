document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('url-analysis-form');
    const urlInput = document.getElementById('url-input');
    const analyzeButton = document.getElementById('analyze-button');
    const tableContainer = document.getElementById('analyses-table-container');

    const STORAGE_KEY = 'accessibilityAnalyses';
    const mockAnalyses = [
        { id: '1', url: 'https://www.exemplo.com.br', date: new Date('2024-01-15T10:30:00'), status: 'completed', score: 85 },
        { id: '2', url: 'https://www.loja-virtual.com', date: new Date('2024-01-14T15:45:00'), status: 'processing', score: null },
        { id: '3', url: 'https://www.blog-noticias.com.br', date: new Date('2024-01-13T09:15:00'), status: 'error', score: null },
        { id: '4', url: 'https://www.empresa-tech.com', date: new Date('2024-01-12T14:20:00'), status: 'completed', score: 92 },
        { id: '5', url: 'https://www.portfolio-designer.com', date: new Date('2024-01-11T11:00:00'), status: 'completed', score: 78 }
    ];

    let analyses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || mockAnalyses;

    function renderTable() {
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
                                        ${formatDate(analysis.date)}
                                    </td>
                                    <td class="py-4 px-6 text-center">
                                        ${getStatusBadge(analysis.status)}
                                    </td>
                                    <td class="py-4 px-6 text-center">
                                        ${analysis.status === 'completed' ? `
                                            <button
                                                onclick="window.location.href='report.html?id=${analysis.id}'"
                                                class="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                                            >
                                                Ver Relatório
                                            </button>
                                        ` : ''}
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
                            <svg class="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0014.015 1H12a3 3 0 00-3 3v4.582m6.115 5.394A8.001 8.001 0 0110.015 23H12a3 3 0 003-3v-4.582m-6.115-5.394A8.001 8.001 0 0114.015 1H12a3 3 0 003-3v4.582m-6.115-5.394A8.001 8.001 0 0110.015 23H12a3 3 0 003-3v-4.582m-6.115-5.394A8.001 8.001 0 0110.015 23H12a3 3 0 003-3v-4.582M4 4v5h.582m15.356 2A8.001 8.001 0 0014.015 1H12a3 3 0 00-3 3v4.582m6.115 5.394A8.001 8.001 0 0110.015 23H12a3 3 0 003-3v-4.582m-6.115-5.394A8.001 8.001 0 0114.015 1H12a3 3 0 003-3v4.582m-6.115-5.394A8.001 8.001 0 0110.015 23H12a3 3 0 003-3v-4.582" /> Processando</span>
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

    function saveAnalyses() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    }

    function handleFormSubmission(event) {
        event.preventDefault();
        const url = urlInput.value.trim();

        // Validação da URL
        try {
            new URL(url);
        } catch (_) {
            urlInput.classList.remove('border-green-300', 'focus:ring-green-200');
            urlInput.classList.add('border-red-300', 'focus:ring-red-200');
            alert('Por favor, insira uma URL válida.');
            return;
        }

        // Simula a análise
        const newAnalysis = {
            id: 'mock-' + Date.now(),
            url: url,
            date: new Date(),
            status: 'processing'
        };

        analyses.unshift(newAnalysis);
        saveAnalyses();
        renderTable();
        urlInput.value = '';
        urlInput.classList.remove('border-red-300', 'border-green-300', 'focus:ring-red-200', 'focus:ring-green-200');

        // Simulação do resultado assíncrono
        setTimeout(() => {
            const index = analyses.findIndex(a => a.id === newAnalysis.id);
            if (index > -1) {
                const updatedStatus = Math.random() > 0.1 ? 'completed' : 'error';
                const score = updatedStatus === 'completed' ? Math.floor(Math.random() * 40) + 60 : null;
                analyses[index].status = updatedStatus;
                analyses[index].score = score;
                saveAnalyses();
                renderTable();
                
                // Mensagem de sucesso/erro
                if (updatedStatus === 'completed') {
                    alert('Análise concluída com sucesso!');
                } else {
                    alert('Erro ao processar a análise. Tente novamente.');
                }
            }
        }, 3000);

        analyzeButton.textContent = 'Analisando...';
        analyzeButton.disabled = true;
        
        setTimeout(() => {
            analyzeButton.textContent = 'Analisar';
            analyzeButton.disabled = false;
        }, 3000);
    }

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

    renderTable();
});