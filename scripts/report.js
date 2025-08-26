document.addEventListener('DOMContentLoaded', () => {
    const reportContainer = document.getElementById('report-container');
    const loadingState = document.getElementById('loading-state');
    const translateButton = document.getElementById('translate-button');
    
    const API_URL = 'http://localhost:3000/api/analyses';
    let pollingInterval;
    let currentAnalysis;
    let currentLanguage = 'pt'; // Define o idioma padrão como português

    // 1. Inicializa o i18next
    i18next
        .use(i18nextHttpBackend)
        .init({
            lng: currentLanguage, // Define a língua inicial
            fallbackLng: 'en', // Língua de fallback caso a tradução não seja encontrada
            backend: {
                loadPath: 'locales/{{lng}}/translation.json' // Caminho para os arquivos de tradução
            },
            debug: true // Apenas para debug, pode ser removido
        }, (err, t) => {
            // Callback após a inicialização. Traduzimos os elementos estáticos aqui.
            updateStaticText();
            const analysisId = new URLSearchParams(window.location.search).get('id');
            if (analysisId) {
                fetchReportData(analysisId);
                pollingInterval = setInterval(() => {
                    fetchReportData(analysisId);
                }, 5000);
            } else {
                renderErrorState(t('no_analysis_id'));
            }
        });

    // Função para traduzir o texto estático
    function updateStaticText() {
        if (translateButton) {
            translateButton.textContent = i18next.t('translate_button');
        }
    }

    // Função para alternar o idioma
    function changeLanguage() {
        currentLanguage = currentLanguage === 'en' ? 'pt' : 'en';
        i18next.changeLanguage(currentLanguage, (err, t) => {
            if (currentAnalysis) {
                renderReport(currentAnalysis);
            }
            updateStaticText();
        });
    }

    async function fetchReportData(analysisId) {
        try {
            const response = await fetch(`${API_URL}/${analysisId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(i18next.t('analysis_not_found'));
                }
                throw new Error(i18next.t('report_load_error'));
            }
            const analysis = await response.json();
            
            if (analysis.status === 'completed' && analysis.results) {
                currentAnalysis = analysis;
                renderReport(currentAnalysis);
                if (pollingInterval) clearInterval(pollingInterval);
            } else if (analysis.status === 'error') {
                renderErrorState(i18next.t('analysis_failed'));
                if (pollingInterval) clearInterval(pollingInterval);
            } else {
                renderProcessingState();
            }

        } catch (error) {
            console.error('Erro:', error);
            renderErrorState(error.message);
            if (pollingInterval) clearInterval(pollingInterval);
        }
    }

    function renderProcessingState() {
        reportContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-blue-500 mx-auto"></div>
                <p class="mt-4 text-lg text-muted-foreground">${i18next.t('loading_text')}</p>
            </div>
        `;
        loadingState.classList.add('hidden');
        reportContainer.classList.remove('hidden');
    }

    function renderErrorState(message) {
        reportContainer.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <p class="text-lg font-bold">${i18next.t('error_text')}</p>
                <p class="mt-2 text-muted-foreground">${message}</p>
                <a href="index.html" class="mt-4 inline-block text-blue-600 hover:underline">${i18next.t('go_back')}</a>
            </div>
        `;
        loadingState.classList.add('hidden');
        reportContainer.classList.remove('hidden');
    }
    
    // As funções renderScoreChart e renderSummaryCards podem permanecer as mesmas,
    // já que as strings que elas usam já foram substituídas nos arquivos de tradução.
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
        const errorCount = issues.violations?.length || 0;
        const warningCount = issues.incomplete?.length || 0;
        const passedCount = issues.passes?.length || 0;

        const cards = [
            { title: i18next.t('errors'), value: errorCount, icon: '!', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
            { title: i18next.t('warnings'), value: warningCount, icon: '?', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
            { title: i18next.t('passed'), value: passedCount, icon: '✓', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
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

    // Modificamos a função renderIssueList para usar i18next
    function renderIssueList(issues, activeTab) {
        let issuesToShow = [];
        let issuesObj = {
            'errors': issues.violations,
            'warnings': issues.incomplete,
            'passed': issues.passes
        };
        
        if (activeTab === 'all') {
            Object.keys(issuesObj).forEach(key => {
                issuesToShow = [...issuesToShow, ...issuesObj[key].map(issue => ({...issue, type: key}))];
            });
        } else {
            issuesToShow = issuesObj[activeTab].map(issue => ({...issue, type: activeTab}));
        }
        
        if (issuesToShow.length === 0) {
            return `<div class="text-center py-8 text-muted-foreground">${i18next.t('no_items')}</div>`;
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
                                    <h3 class="font-bold text-lg text-gray-900 dark:text-white">${i18next.t(`issue_violations.${issue.id}.help`)}</h3>
                                    ${getIssueBadge(issue.type)}
                                </div>
                                <p class="text-gray-700 leading-relaxed dark:text-gray-400">
                                    ${i18next.t(`issue_violations.${issue.id}.description`)}
                                </p>
                                <div class="bg-gray-50 rounded p-3 border dark:bg-gray-700 dark:border-gray-600">
                                    <p class="text-sm text-gray-600 mb-1 font-medium dark:text-gray-400">${i18next.t('element_affected')}</p>
                                    <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono dark:bg-gray-600 dark:text-gray-200">
                                        ${issue.nodes[0]?.html || 'Não especificado'}
                                    </code>
                                </div>
                                <div class="bg-blue-50 rounded p-3 border border-blue-200 dark:bg-blue-900 dark:border-blue-800">
                                    <p class="text-sm text-blue-800 mb-2 font-medium dark:text-blue-200">${i18next.t('recommendation')}</p>
                                    <p class="text-sm text-blue-700 leading-relaxed dark:text-blue-300">
                                        ${issue.helpUrl ? `<a href="${issue.helpUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">${i18next.t('documentation_wcag')}</a>` : 'Não especificado'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function getIssueIcon(type) {
        switch (type) {
            case 'errors':
                return `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>`;
            case 'warnings':
                return `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L.92 20.21c-.51.88-.33 2.24.49 2.76.82.52 2.08.34 2.6-.48l9.37-16.35c.51-.88.33-2.24-.49-2.76-.82-.52-2.08-.34-2.6.48zm1.71 14.14v.01"/></svg>`;
            case 'passed':
                return `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-8.66"/><path d="M22 4L12 14.01l-3-3"/></svg>`;
        }
    }

    function getIssueBadge(type) {
        let text;
        switch (type) {
            case 'errors':
                text = i18next.t('error_found');
                return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">${text}</span>`;
            case 'warnings':
                text = i18next.t('warning_found');
                return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">${text}</span>`;
            case 'passed':
                text = i18next.t('passed_found');
                return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">${text}</span>`;
        }
    }

    // Modificamos a função renderReport para usar i18next
    function renderReport(analysis) {
        const issues = analysis.results;
        const totalIssues = (issues.violations?.length || 0) + (issues.incomplete?.length || 0) + (issues.passes?.length || 0);

        reportContainer.innerHTML = `
            <div class="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h1 class="text-2xl font-bold mb-2">${i18next.t('report_title')}</h1>
                        <p class="text-muted-foreground">${analysis.url}</p>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
                    <h2 class="text-xl font-bold mb-6 text-center">${i18next.t('score_title')}</h2>
                    ${renderScoreChart(analysis.score)}
                </div>
                <div class="space-y-6">
                    <h2 class="text-xl font-bold">${i18next.t('summary_title')}</h2>
                    ${renderSummaryCards(issues)}
                </div>
            </div>
            <div class="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
                <h2 class="text-xl font-bold mb-6">${i18next.t('detailed_report_title')}</h2>
                <div class="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg dark:bg-gray-700">
                    <button class="tab-trigger px-4 py-2 rounded-md font-medium transition-colors bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" data-tab="all">
                        ${i18next.t('all_items')} (${totalIssues})
                    </button>
                    <button class="tab-trigger px-4 py-2 rounded-md font-medium transition-colors text-red-600 hover:text-red-800" data-tab="errors">
                        ${i18next.t('errors')} (${issues.violations.length})
                    </button>
                    <button class="tab-trigger px-4 py-2 rounded-md font-medium transition-colors text-yellow-600 hover:text-yellow-800" data-tab="warnings">
                        ${i18next.t('warnings')} (${issues.incomplete.length})
                    </button>
                    <button class="tab-trigger px-4 py-2 rounded-md font-medium transition-colors text-green-600 hover:text-green-800" data-tab="passed">
                        ${i18next.t('passed')} (${issues.passes.length})
                    </button>
                </div>
                <div id="issue-list">
                    ${renderIssueList(issues, 'all')}
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
                issueList.innerHTML = renderIssueList(issues, button.dataset.tab);
            });
        });
        
        loadingState.classList.add('hidden');
        reportContainer.classList.remove('hidden');
    }

    const analysisId = new URLSearchParams(window.location.search).get('id');
    


    if (translateButton) {
        translateButton.addEventListener('click', changeLanguage);
    }
});