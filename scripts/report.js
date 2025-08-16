document.addEventListener('DOMContentLoaded', () => {
    const reportContainer = document.getElementById('report-container');
    const loadingState = document.getElementById('loading-state');
    
    const STORAGE_KEY = 'accessibilityAnalyses';
    const mockReports = {
        '1': {
            url: 'https://www.exemplo.com.br',
            score: 85,
            results: {
                errors: [
                    { id: 'e1', type: 'error', title: 'Alt Text Ausente', description: 'Imagens sem texto alternativo.', element: '#logo img', recommendation: 'Adicione alt descritivo.' }
                ],
                warnings: [
                    { id: 'w1', type: 'warning', title: 'Links sem Contexto', description: 'Links com texto como "clique aqui".', element: '.link', recommendation: 'Use texto descritivo.' }
                ],
                passed: [
                    { id: 'p1', type: 'passed', title: 'Estrutura HTML Semântica', description: 'A página usa tags semânticas.', element: 'header, main', recommendation: 'Continue usando elementos semânticos.' }
                ]
            }
        },
        '4': {
            url: 'https://www.empresa-tech.com',
            score: 92,
            results: {
                errors: [],
                warnings: [
                    { id: 'w2', type: 'warning', title: 'Imagens sem Dimensões', description: 'Imagens não possuem width e height.', element: '.gallery img', recommendation: 'Especifique dimensões.' }
                ],
                passed: [
                    { id: 'p2', type: 'passed', title: 'Excelente Contraste', description: 'Todos os textos têm contraste adequado.', element: 'body *', recommendation: 'Continue mantendo boas práticas.' }
                ]
            }
        },
        '5': {
            url: 'https://www.portfolio-designer.com',
            score: 78,
            results: {
                errors: [
                    { id: 'e2', type: 'error', title: 'Falta de Skip Links', description: 'A página não tem links para pular para o conteúdo principal.', element: 'body', recommendation: 'Adicione um link "Pular para o conteúdo".' }
                ],
                warnings: [],
                passed: [
                    { id: 'p3', type: 'passed', title: 'Design Responsivo', description: 'O site adapta-se a telas diferentes.', element: 'body', recommendation: 'Continue testando em vários dispositivos.' }
                ]
            }
        }
    };

    function getAnalysisIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    function renderScoreChart(score) {
        const color = score >= 80 ? 'green-500' : score >= 60 ? 'yellow-500' : 'red-500';
        const strokeColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
        const circumference = 2 * Math.PI * 45;
        const strokeDashoffset = circumference - (score / 100) * circumference;

        return `
            <div class="relative w-48 h-48 mx-auto">
                <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#f3f4f6" stroke-width="8" fill="none"></circle>
                    <circle
                        cx="50" cy="50" r="45"
                        stroke="${strokeColor}"
                        stroke-width="8"
                        fill="none"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${strokeDashoffset}"
                        stroke-linecap="round"
                        class="transition-all duration-1000 ease-out"
                    ></circle>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <div class="text-4xl font-bold text-gray-900">${score}</div>
                    <div class="text-sm text-gray-500">/100</div>
                </div>
            </div>
        `;
    }

    function renderSummaryCards(issues) {
        const errorCount = issues.errors.length;
        const warningCount = issues.warnings.length;
        const passedCount = issues.passed.length;

        const cards = [
            { title: 'Erros Encontrados', value: errorCount, icon: '!', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
            { title: 'Avisos Encontrados', value: warningCount, icon: '?', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
            { title: 'Verificações Aprovadas', value: passedCount, icon: '✓', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
        ];

        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${cards.map(card => `
                    <div class="bg-white rounded-lg border p-6 text-center ${card.bgColor} ${card.borderColor} border-2 dark:bg-gray-800 dark:border-gray-700">
                        <div class="${card.color} text-4xl font-bold mb-3">${card.icon}</div>
                        <div class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">${card.value}</div>
                        <div class="text-sm text-gray-700 dark:text-gray-400">${card.title}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderIssueList(issues, activeTab) {
        let issuesToShow;
        switch (activeTab) {
            case 'errors':
                issuesToShow = issues.errors;
                break;
            case 'warnings':
                issuesToShow = issues.warnings;
                break;
            case 'passed':
                issuesToShow = issues.passed;
                break;
            default:
                issuesToShow = [...issues.errors, ...issues.warnings, ...issues.passed];
        }

        if (issuesToShow.length === 0) {
            return `<div class="text-center py-8 text-muted-foreground">Nenhum item encontrado nesta categoria.</div>`;
        }

        return `
            <div class="space-y-4">
                ${issuesToShow.map(issue => `
                    <div class="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0 mt-1">
                                ${getIssueIcon(issue.type)}
                            </div>
                            <div class="flex-grow space-y-3">
                                <div class="flex items-center gap-3 flex-wrap">
                                    <h3 class="font-bold text-lg text-gray-900 dark:text-white">${issue.title}</h3>
                                    ${getIssueBadge(issue.type)}
                                </div>
                                <p class="text-gray-700 leading-relaxed dark:text-gray-400">
                                    ${issue.description}
                                </p>
                                <div class="bg-gray-50 rounded p-3 border dark:bg-gray-700 dark:border-gray-600">
                                    <p class="text-sm text-gray-600 mb-1 font-medium dark:text-gray-400">Elemento Afetado:</p>
                                    <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono dark:bg-gray-600 dark:text-gray-200">
                                        ${issue.element}
                                    </code>
                                </div>
                                <div class="bg-blue-50 rounded p-3 border border-blue-200 dark:bg-blue-900 dark:border-blue-800">
                                    <p class="text-sm text-blue-800 mb-2 font-medium dark:text-blue-200">Recomendação:</p>
                                    <p class="text-sm text-blue-700 leading-relaxed dark:text-blue-300">
                                        ${issue.recommendation}
                                    </p>
                                </div>
                                ${issue.wcagLink ? `
                                    <div>
                                        <a href="${issue.wcagLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline dark:text-blue-400 dark:hover:text-blue-200">
                                            Ver Documentação WCAG
                                        </a>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function getIssueIcon(type) {
        switch (type) {
            case 'error':
                return `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>`;
            case 'warning':
                return `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L.92 20.21c-.51.88-.33 2.24.49 2.76.82.52 2.08.34 2.6-.48l9.37-16.35c.51-.88.33-2.24-.49-2.76-.82-.52-2.08-.34-2.6.48zm1.71 14.14v.01"/></svg>`;
            case 'passed':
                return `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-8.66"/><path d="M22 4L12 14.01l-3-3"/></svg>`;
        }
    }

    function getIssueBadge(type) {
        switch (type) {
            case 'error':
                return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Erro</span>`;
            case 'warning':
                return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">Aviso</span>`;
            case 'passed':
                return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Aprovado</span>`;
        }
    }

    function renderReport(analysis) {
        const totalIssues = analysis.results.errors.length + analysis.results.warnings.length + analysis.results.passed.length;
        
        reportContainer.innerHTML = `
            <div class="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h1 class="text-2xl font-bold mb-2">Relatório de Análise</h1>
                        <p class="text-muted-foreground">${analysis.url}</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
                    <h2 class="text-xl font-bold mb-6 text-center">Pontuação de Acessibilidade</h2>
                    ${renderScoreChart(analysis.score)}
                </div>

                <div class="space-y-6">
                    <h2 class="text-xl font-bold">Resumo das Verificações</h2>
                    ${renderSummaryCards(analysis.results)}
                </div>
            </div>

            <div class="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
                <h2 class="text-xl font-bold mb-6">Relatório Detalhado</h2>
                
                <div class="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg dark:bg-gray-700">
                    <button class="tab-trigger px-4 py-2 rounded-md font-medium transition-colors bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" data-tab="all">
                        Todos os Itens (${totalIssues})
                    </button>
                    <button class="tab-trigger px-4 py-2 rounded-md font-medium transition-colors text-red-600 hover:text-red-800" data-tab="errors">
                        Erros (${analysis.results.errors.length})
                    </button>
                    <button class="tab-trigger px-4 py-2 rounded-md font-medium transition-colors text-yellow-600 hover:text-yellow-800" data-tab="warnings">
                        Avisos (${analysis.results.warnings.length})
                    </button>
                    <button class="tab-trigger px-4 py-2 rounded-md font-medium transition-colors text-green-600 hover:text-green-800" data-tab="passed">
                        Aprovados (${analysis.results.passed.length})
                    </button>
                </div>

                <div id="issue-list">
                    ${renderIssueList(analysis.results, 'all')}
                </div>
            </div>
        `;

        const tabButtons = document.querySelectorAll('.tab-trigger');
        const issueList = document.getElementById('issue-list');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => {
                    btn.classList.remove('bg-white', 'shadow-sm', 'text-gray-900', 'dark:bg-gray-800', 'dark:text-white');
                    btn.classList.add('hover:text-gray-700');
                    if (btn.dataset.tab === 'errors') btn.classList.remove('text-red-600');
                    if (btn.dataset.tab === 'warnings') btn.classList.remove('text-yellow-600');
                    if (btn.dataset.tab === 'passed') btn.classList.remove('text-green-600');
                });
                button.classList.add('bg-white', 'shadow-sm', 'text-gray-900', 'dark:bg-gray-800', 'dark:text-white');
                issueList.innerHTML = renderIssueList(analysis.results, button.dataset.tab);
            });
        });
        
        loadingState.classList.add('hidden');
        reportContainer.classList.remove('hidden');
    }

    const analysisId = getAnalysisIdFromUrl();

    if (!analysisId) {
        reportContainer.innerHTML = `<div class="text-center py-12 text-muted-foreground">Relatório não encontrado. Por favor, retorne ao <a href="index.html" class="text-blue-600 hover:underline">dashboard</a>.</div>`;
        loadingState.classList.add('hidden');
        reportContainer.classList.remove('hidden');
        return;
    }

    const analysesFromStorage = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const analysis = analysesFromStorage.find(a => a.id === analysisId) || mockReports[analysisId];

    if (analysis) {
        renderReport(analysis);
    } else {
        reportContainer.innerHTML = `<div class="text-center py-12 text-muted-foreground">Relatório não encontrado. Por favor, retorne ao <a href="index.html" class="text-blue-600 hover:underline">dashboard</a>.</div>`;
        loadingState.classList.add('hidden');
        reportContainer.classList.remove('hidden');
    }
});