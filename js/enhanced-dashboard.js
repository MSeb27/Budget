// ===== TABLEAU DE BORD AMÉLIORÉ =====
class EnhancedDashboard {
    constructor(transactionManager, predictionsAI, chartManager) {
        this.transactionManager = transactionManager;
        this.predictionsAI = predictionsAI;
        this.chartManager = chartManager;
        this.widgets = new Map();
        this.refreshInterval = null;
        this.fullscreenChart = null;
        this.gridLayout = null;
        this.initialized = false;
        
        // Initialisation différée pour éviter les erreurs
        setTimeout(() => {
            this.initializeDashboard();
        }, 100);
    }

    // ===== INITIALISATION =====
    initializeDashboard() {
        try {
            // Vérifier que le conteneur existe
            const dashboardContainer = document.getElementById('enhanced-dashboard');
            if (!dashboardContainer) {
                console.warn('⚠️ Conteneur dashboard non trouvé');
                return;
            }

            // Vérifier que les gestionnaires sont disponibles
            if (!this.transactionManager) {
                console.warn('⚠️ TransactionManager non disponible');
                return;
            }

            this.createDashboardLayout();
            this.initializeWidgets();
            this.loadDashboardPreferences();
            this.setupEventListeners();
            
            // Mise à jour initiale après un délai
            setTimeout(() => {
                this.updateAllWidgets();
                this.startAutoRefresh();
                this.initialized = true;
                console.log('✅ Dashboard amélioré initialisé');
            }, 200);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du dashboard:', error);
        }
    }

    createDashboardLayout() {
        const dashboardContainer = document.getElementById('enhanced-dashboard');
        if (!dashboardContainer) return;

        dashboardContainer.innerHTML = `
            <div class="dashboard-header">
                <div class="dashboard-title">
                    <h2>📊 Tableau de Bord Intelligent</h2>
                    <div class="dashboard-date">${new Date().toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</div>
                </div>
                <div class="dashboard-controls">
                    <button class="btn-dashboard-control" id="refresh-dashboard">🔄 Actualiser</button>
                    <button class="btn-dashboard-control" id="customize-dashboard">⚙️ Personnaliser</button>
                    <button class="btn-dashboard-control" id="export-dashboard">📊 Exporter</button>
                </div>
            </div>
            
            <div class="dashboard-alerts" id="dashboard-alerts"></div>
            
            <div class="dashboard-grid" id="dashboard-grid">
                <!-- Les widgets seront générés dynamiquement -->
            </div>
            
            <div class="dashboard-insights" id="dashboard-insights">
                <h3>💡 Insights Automatiques</h3>
                <div class="insights-container" id="insights-container"></div>
            </div>
        `;

        this.setupFullscreenModal();
    }

    setupFullscreenModal() {
        const modal = document.createElement('div');
        modal.id = 'fullscreen-chart-modal';
        modal.className = 'fullscreen-modal';
        modal.innerHTML = `
            <div class="fullscreen-content">
                <div class="fullscreen-header">
                    <h3 id="fullscreen-chart-title">Graphique</h3>
                    <div class="fullscreen-controls">
                        <button class="btn-fullscreen-control" id="chart-settings">⚙️</button>
                        <button class="btn-fullscreen-control" id="export-chart">💾</button>
                        <button class="btn-fullscreen-control" id="close-fullscreen">✕</button>
                    </div>
                </div>
                <div class="fullscreen-chart-container" id="fullscreen-chart-container">
                    <!-- Le graphique plein écran sera inséré ici -->
                </div>
                <div class="fullscreen-toolbar">
                    <div class="chart-controls">
                        <button class="chart-control-btn" data-action="zoom-in">🔍+</button>
                        <button class="chart-control-btn" data-action="zoom-out">🔍-</button>
                        <button class="chart-control-btn" data-action="reset-zoom">🔄</button>
                        <button class="chart-control-btn" data-action="toggle-animation">🎬</button>
                    </div>
                    <div class="chart-options">
                        <select id="chart-time-range">
                            <option value="1m">1 mois</option>
                            <option value="3m">3 mois</option>
                            <option value="6m">6 mois</option>
                            <option value="1y" selected>1 an</option>
                            <option value="all">Tout</option>
                        </select>
                        <select id="chart-type-selector">
                            <option value="line">Ligne</option>
                            <option value="bar">Barres</option>
                            <option value="area">Aires</option>
                            <option value="pie">Camembert</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    initializeWidgets() {
        const widgetConfigs = [
            {
                id: 'quick-stats',
                title: '📈 Statistiques Rapides',
                type: 'stats',
                size: 'medium',
                priority: 1
            },
            {
                id: 'balance-trend',
                title: '💰 Évolution du Solde',
                type: 'chart',
                chartType: 'line',
                size: 'large',
                priority: 2
            },
            {
                id: 'monthly-breakdown',
                title: '🍰 Répartition Mensuelle',
                type: 'chart',
                chartType: 'doughnut',
                size: 'medium',
                priority: 3
            },
            {
                id: 'predictions',
                title: '🔮 Prédictions',
                type: 'predictions',
                size: 'medium',
                priority: 4
            },
            {
                id: 'recent-transactions',
                title: '📋 Dernières Transactions',
                type: 'transactions',
                size: 'large',
                priority: 5
            },
            {
                id: 'budget-alerts',
                title: '⚠️ Alertes Budget',
                type: 'alerts',
                size: 'small',
                priority: 6
            },
            {
                id: 'categories-heatmap',
                title: '🌡️ Heatmap Catégories',
                type: 'chart',
                chartType: 'heatmap',
                size: 'large',
                priority: 7
            },
            {
                id: 'savings-goal',
                title: '🎯 Objectif d\'Épargne',
                type: 'progress',
                size: 'medium',
                priority: 8
            }
        ];

        widgetConfigs.forEach(config => {
            this.createWidget(config);
        });
    }

    createWidget(config) {
        const widget = document.createElement('div');
        widget.className = `dashboard-widget widget-${config.size}`;
        widget.id = `widget-${config.id}`;
        widget.dataset.priority = config.priority;

        widget.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">${config.title}</h3>
                <div class="widget-controls">
                    ${config.type === 'chart' ? '<button class="widget-fullscreen" title="Plein écran">⛶</button>' : ''}
                    <button class="widget-refresh" title="Actualiser">🔄</button>
                    <button class="widget-settings" title="Paramètres">⚙️</button>
                </div>
            </div>
            <div class="widget-content" id="content-${config.id}">
                <div class="widget-loading">Chargement...</div>
            </div>
        `;

        this.widgets.set(config.id, {
            element: widget,
            config: config,
            lastUpdate: null,
            refreshFunction: this.getWidgetRefreshFunction(config)
        });

        document.getElementById('dashboard-grid').appendChild(widget);
        this.setupWidgetEventListeners(widget, config);
    }

    getWidgetRefreshFunction(config) {
        switch (config.type) {
            case 'stats': return () => this.updateStatsWidget(config.id);
            case 'chart': return () => this.updateChartWidget(config.id);
            case 'predictions': return () => this.updatePredictionsWidget(config.id);
            case 'transactions': return () => this.updateTransactionsWidget(config.id);
            case 'alerts': return () => this.updateAlertsWidget(config.id);
            case 'progress': return () => this.updateProgressWidget(config.id);
            default: return () => console.log(`Widget type ${config.type} not implemented`);
        }
    }

    setupWidgetEventListeners(widget, config) {
        // Plein écran pour graphiques
        const fullscreenBtn = widget.querySelector('.widget-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.openChartFullscreen(config.id, config.title);
            });
        }

        // Actualisation
        const refreshBtn = widget.querySelector('.widget-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshWidget(config.id);
            });
        }

        // Paramètres
        const settingsBtn = widget.querySelector('.widget-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openWidgetSettings(config.id);
            });
        }
    }

    setupEventListeners() {
        // Contrôles du dashboard
        document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
            this.refreshAllWidgets();
        });

        document.getElementById('customize-dashboard')?.addEventListener('click', () => {
            this.openCustomizationPanel();
        });

        document.getElementById('export-dashboard')?.addEventListener('click', () => {
            this.exportDashboard();
        });

        // Modal plein écran
        document.getElementById('close-fullscreen')?.addEventListener('click', () => {
            this.closeFullscreen();
        });

        document.getElementById('export-chart')?.addEventListener('click', () => {
            this.exportFullscreenChart();
        });

        // Contrôles de graphique plein écran
        document.querySelectorAll('.chart-control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleChartControl(e.target.dataset.action);
            });
        });

        // Sélecteurs de plein écran
        document.getElementById('chart-time-range')?.addEventListener('change', (e) => {
            this.updateFullscreenChart({ timeRange: e.target.value });
        });

        document.getElementById('chart-type-selector')?.addEventListener('change', (e) => {
            this.updateFullscreenChart({ chartType: e.target.value });
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.fullscreenChart) {
                this.closeFullscreen();
            }
            if (e.key === 'F11' && this.fullscreenChart) {
                e.preventDefault();
                document.documentElement.requestFullscreen();
            }
        });
    }

    // ===== MISE À JOUR DES WIDGETS =====

    async updateStatsWidget(widgetId) {
        const content = document.getElementById(`content-${widgetId}`);
        if (!content) return;

        try {
            // Vérifier que transactionManager est disponible
            if (!this.transactionManager) {
                throw new Error('TransactionManager non disponible');
            }

            const stats = this.transactionManager.getTotalStats();
            const currentMonth = this.transactionManager.getMonthlyStats(
                new Date().getFullYear(),
                new Date().getMonth()
            );

            // Vérifier que les données sont valides
            if (!stats || typeof stats.totalBalance === 'undefined') {
                throw new Error('Données statistiques invalides');
            }

            const html = `
                <div class="stats-grid">
                    <div class="stat-item balance ${stats.totalBalance >= 0 ? 'positive' : 'negative'}">
                        <div class="stat-value">${Utils.formatCurrency(stats.totalBalance)}</div>
                        <div class="stat-label">Solde Total</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${Utils.formatCurrency(currentMonth.income)}</div>
                        <div class="stat-label">Revenus ce mois</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${Utils.formatCurrency(currentMonth.expenses)}</div>
                        <div class="stat-label">Dépenses ce mois</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.totalTransactions}</div>
                        <div class="stat-label">Transactions</div>
                    </div>
                </div>
                <div class="stats-comparison">
                    <div class="comparison-item">
                        <span class="comparison-label">vs mois dernier:</span>
                        <span class="comparison-value ${this.getComparisonClass(currentMonth.balance)}">
                            ${this.getMonthComparison()}
                        </span>
                    </div>
                </div>
            `;

            content.innerHTML = html;
        } catch (error) {
            console.error('Erreur dans updateStatsWidget:', error);
            this.showWidgetError(content, error);
        }
    }

    async updateChartWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        const content = document.getElementById(`content-${widgetId}`);
        if (!content || !widget) return;

        try {
            // Vérifier que Chart.js est disponible
            if (typeof Chart === 'undefined') {
                throw new Error('Chart.js non chargé');
            }

            content.innerHTML = `<canvas id="chart-${widgetId}" class="widget-chart"></canvas>`;
            
            const chartConfig = this.getChartConfig(widget.config.chartType, widgetId);
            const canvas = document.getElementById(`chart-${widgetId}`);
            
            if (!canvas) {
                throw new Error('Canvas non trouvé');
            }
            
            const ctx = canvas.getContext('2d');
            
            if (widget.chartInstance) {
                widget.chartInstance.destroy();
            }
            
            widget.chartInstance = new Chart(ctx, chartConfig);
        } catch (error) {
            console.error('Erreur dans updateChartWidget:', error);
            this.showWidgetError(content, error);
        }
    }

    async updatePredictionsWidget(widgetId) {
        const content = document.getElementById(`content-${widgetId}`);
        if (!content) return;

        try {
            content.innerHTML = '<div class="widget-loading">Calcul des prédictions...</div>';
            
            if (!this.predictionsAI) {
                throw new Error('Moteur de prédictions non disponible');
            }
            
            const predictions = await this.predictionsAI.predictNextMonthExpenses();
            
            if (!predictions || typeof predictions.totalAmount === 'undefined') {
                throw new Error('Prédictions invalides');
            }
            
            const html = `
                <div class="predictions-container">
                    <div class="prediction-main">
                        <div class="prediction-amount ${predictions.confidence > 0.7 ? 'high-confidence' : 'low-confidence'}">
                            ${Utils.formatCurrency(predictions.totalAmount)}
                        </div>
                        <div class="prediction-label">Prédiction mois prochain</div>
                        <div class="prediction-confidence">
                            Confiance: ${(predictions.confidence * 100).toFixed(0)}%
                        </div>
                    </div>
                    <div class="prediction-breakdown">
                        <h4>Top 3 catégories prévues:</h4>
                        ${this.renderTopCategories(predictions.breakdown)}
                    </div>
                    <div class="prediction-trends">
                        <div class="trend-indicator ${predictions.trends?.overall?.direction || 'stable'}">
                            ${this.getTrendIcon(predictions.trends?.overall?.direction || 'stable')} 
                            ${this.getTrendText(predictions.trends?.overall?.direction || 'stable')}
                        </div>
                    </div>
                </div>
            `;

            content.innerHTML = html;
        } catch (error) {
            console.error('Erreur dans updatePredictionsWidget:', error);
            this.showWidgetError(content, error);
        }
    }

    async updateTransactionsWidget(widgetId) {
        const content = document.getElementById(`content-${widgetId}`);
        if (!content) return;

        try {
            const recentTransactions = this.transactionManager.getAllTransactions()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            const html = `
                <div class="recent-transactions">
                    ${recentTransactions.map(transaction => `
                        <div class="transaction-item ${transaction.type}">
                            <div class="transaction-icon">
                                ${transaction.type === 'income' ? '💰' : '💸'}
                            </div>
                            <div class="transaction-details">
                                <div class="transaction-label">${transaction.label}</div>
                                <div class="transaction-meta">
                                    ${transaction.category} • ${Utils.formatDateDisplay(transaction.date)}
                                </div>
                            </div>
                            <div class="transaction-amount ${transaction.type}">
                                ${transaction.type === 'income' ? '+' : '-'}${Utils.formatCurrency(transaction.amount)}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="widget-footer">
                    <button class="btn-view-all" onclick="app.switchTab('budget')">
                        Voir toutes les transactions →
                    </button>
                </div>
            `;

            content.innerHTML = html;
        } catch (error) {
            this.showWidgetError(content, error);
        }
    }

    async updateAlertsWidget(widgetId) {
        const content = document.getElementById(`content-${widgetId}`);
        if (!content) return;

        try {
            const alerts = await this.generateBudgetAlerts();
            
            if (alerts.length === 0) {
                content.innerHTML = `
                    <div class="no-alerts">
                        <div class="no-alerts-icon">✅</div>
                        <div class="no-alerts-text">Aucune alerte</div>
                    </div>
                `;
                return;
            }

            const html = `
                <div class="alerts-list">
                    ${alerts.slice(0, 3).map(alert => `
                        <div class="alert-item ${alert.severity}">
                            <div class="alert-icon">${this.getAlertIcon(alert.type)}</div>
                            <div class="alert-content">
                                <div class="alert-title">${alert.title}</div>
                                <div class="alert-description">${alert.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${alerts.length > 3 ? `<div class="alerts-more">+${alerts.length - 3} autres alertes</div>` : ''}
            `;

            content.innerHTML = html;
        } catch (error) {
            this.showWidgetError(content, error);
        }
    }

    async updateProgressWidget(widgetId) {
        const content = document.getElementById(`content-${widgetId}`);
        if (!content) return;

        try {
            // Simulation d'un objectif d'épargne
            const currentBalance = this.transactionManager.getTotalStats().totalBalance;
            const savingsGoal = 5000; // Objectif fixe pour l'exemple
            const progress = Math.max(0, Math.min(100, (currentBalance / savingsGoal) * 100));

            const html = `
                <div class="progress-container">
                    <div class="progress-header">
                        <div class="progress-title">Objectif d'épargne</div>
                        <div class="progress-amount">
                            ${Utils.formatCurrency(currentBalance)} / ${Utils.formatCurrency(savingsGoal)}
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-percentage">${progress.toFixed(1)}%</div>
                    </div>
                    <div class="progress-stats">
                        <div class="stat">
                            <span class="stat-label">Restant:</span>
                            <span class="stat-value">${Utils.formatCurrency(Math.max(0, savingsGoal - currentBalance))}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Échéance estimée:</span>
                            <span class="stat-value">${this.estimateGoalDate(currentBalance, savingsGoal)}</span>
                        </div>
                    </div>
                </div>
            `;

            content.innerHTML = html;
        } catch (error) {
            this.showWidgetError(content, error);
        }
    }

    // ===== PLEIN ÉCRAN POUR GRAPHIQUES =====

    openChartFullscreen(widgetId, title) {
        const modal = document.getElementById('fullscreen-chart-modal');
        const chartTitle = document.getElementById('fullscreen-chart-title');
        const chartContainer = document.getElementById('fullscreen-chart-container');

        chartTitle.textContent = title;
        modal.classList.add('active');
        
        this.fullscreenChart = {
            widgetId,
            title,
            container: chartContainer
        };

        // Créer le graphique plein écran
        this.createFullscreenChart(widgetId);
        
        // Ajouter class pour désactiver le scroll du body
        document.body.classList.add('fullscreen-active');
    }

    createFullscreenChart(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget || widget.config.type !== 'chart') return;

        const container = this.fullscreenChart.container;
        container.innerHTML = `<canvas id="fullscreen-chart-canvas" class="fullscreen-chart"></canvas>`;

        const ctx = document.getElementById('fullscreen-chart-canvas').getContext('2d');
        const chartConfig = this.getChartConfig(widget.config.chartType, widgetId, true);
        
        // Configuration spéciale pour plein écran
        chartConfig.options = {
            ...chartConfig.options,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                ...chartConfig.options.plugins,
                legend: {
                    ...chartConfig.options.plugins?.legend,
                    position: 'top',
                    labels: {
                        padding: 30,
                        usePointStyle: true,
                        font: {
                            size: 16
                        }
                    }
                }
            },
            scales: {
                ...chartConfig.options.scales,
                x: {
                    ...chartConfig.options.scales?.x,
                    ticks: {
                        font: {
                            size: 14
                        }
                    }
                },
                y: {
                    ...chartConfig.options.scales?.y,
                    ticks: {
                        font: {
                            size: 14
                        }
                    }
                }
            }
        };

        this.fullscreenChart.chartInstance = new Chart(ctx, chartConfig);
    }

    updateFullscreenChart(options = {}) {
        if (!this.fullscreenChart?.chartInstance) return;

        // Recréer le graphique avec les nouvelles options
        this.fullscreenChart.chartInstance.destroy();
        this.createFullscreenChart(this.fullscreenChart.widgetId);
    }

    handleChartControl(action) {
        if (!this.fullscreenChart?.chartInstance) return;

        const chart = this.fullscreenChart.chartInstance;

        switch (action) {
            case 'zoom-in':
                chart.zoom(1.2);
                break;
            case 'zoom-out':
                chart.zoom(0.8);
                break;
            case 'reset-zoom':
                chart.resetZoom();
                break;
            case 'toggle-animation':
                chart.options.animation.duration = chart.options.animation.duration > 0 ? 0 : 1000;
                chart.update();
                break;
        }
    }

    closeFullscreen() {
        const modal = document.getElementById('fullscreen-chart-modal');
        modal.classList.remove('active');
        
        if (this.fullscreenChart?.chartInstance) {
            this.fullscreenChart.chartInstance.destroy();
        }
        
        this.fullscreenChart = null;
        document.body.classList.remove('fullscreen-active');
    }

    exportFullscreenChart() {
        if (!this.fullscreenChart?.chartInstance) return;

        const chart = this.fullscreenChart.chartInstance;
        const link = document.createElement('a');
        link.download = `${this.fullscreenChart.title.replace(/[^a-z0-9]/gi, '_')}.png`;
        link.href = chart.toBase64Image();
        link.click();
    }

    // ===== CONFIGURATION DES GRAPHIQUES =====

    getChartConfig(chartType, widgetId, isFullscreen = false) {
        try {
            const baseConfig = {
                responsive: true,
                maintainAspectRatio: !isFullscreen,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            };

            switch (chartType) {
                case 'line':
                    return this.getLineChartConfig(widgetId, baseConfig);
                case 'doughnut':
                    return this.getDoughnutChartConfig(widgetId, baseConfig);
                case 'bar':
                    return this.getBarChartConfig(widgetId, baseConfig);
                case 'heatmap':
                    return this.getHeatmapChartConfig(widgetId, baseConfig);
                default:
                    return this.getLineChartConfig(widgetId, baseConfig);
            }
        } catch (error) {
            console.error('Erreur dans getChartConfig:', error);
            // Retourner une configuration par défaut simple
            return {
                type: 'line',
                data: {
                    labels: ['Aucune donnée'],
                    datasets: [{
                        label: 'Erreur',
                        data: [0],
                        borderColor: '#dc2626'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: !isFullscreen
                }
            };
        }
    }

    getLineChartConfig(widgetId, baseConfig) {
        try {
            const months = Utils.getLastNMonths(12);
            const data = months.map(month => {
                try {
                    const stats = this.transactionManager.getMonthlyStats(
                        month.date.getFullYear(),
                        month.date.getMonth()
                    );
                    return stats.balance || 0;
                } catch (error) {
                    console.warn('Erreur pour le mois:', month, error);
                    return 0;
                }
            });

            return {
                type: 'line',
                data: {
                    labels: months.map(m => m.label),
                    datasets: [{
                        label: 'Solde mensuel',
                        data: data,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    ...baseConfig,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return value + '€';
                                }
                            }
                        }
                    }
                }
            };
        } catch (error) {
            console.error('Erreur dans getLineChartConfig:', error);
            return this.getEmptyChartConfig('line');
        }
    }

    getEmptyChartConfig(type) {
        return {
            type: type,
            data: {
                labels: ['Aucune donnée'],
                datasets: [{
                    label: 'Pas de données disponibles',
                    data: [0],
                    borderColor: '#6b7280',
                    backgroundColor: 'rgba(107, 114, 128, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        };
    }

    getDoughnutChartConfig(widgetId, baseConfig) {
        try {
            const currentMonth = new Date();
            const transactions = this.transactionManager.getTransactionsByMonth(
                currentMonth.getFullYear(),
                currentMonth.getMonth()
            ).filter(t => t.type === 'expense');

            const categoryTotals = {};
            transactions.forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

            const sortedCategories = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8);

            if (sortedCategories.length === 0) {
                return this.getEmptyChartConfig('doughnut');
            }

            const colors = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
            ];

            return {
                type: 'doughnut',
                data: {
                    labels: sortedCategories.map(([cat]) => cat),
                    datasets: [{
                        data: sortedCategories.map(([,amount]) => amount),
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    ...baseConfig,
                    plugins: {
                        ...baseConfig.plugins,
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed.toFixed(2)}€ (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            };
        } catch (error) {
            console.error('Erreur dans getDoughnutChartConfig:', error);
            return this.getEmptyChartConfig('doughnut');
        }
    }

    getBarChartConfig(widgetId, baseConfig) {
        const months = Utils.getLastNMonths(6);
        const incomeData = [];
        const expenseData = [];

        months.forEach(month => {
            const stats = this.transactionManager.getMonthlyStats(
                month.date.getFullYear(),
                month.date.getMonth()
            );
            incomeData.push(stats.income);
            expenseData.push(stats.expenses);
        });

        return {
            type: 'bar',
            data: {
                labels: months.map(m => m.label),
                datasets: [
                    {
                        label: 'Revenus',
                        data: incomeData,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1
                    },
                    {
                        label: 'Dépenses',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...baseConfig,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '€';
                            }
                        }
                    }
                }
            }
        };
    }

    getHeatmapChartConfig(widgetId, baseConfig) {
        // Simulation d'une heatmap avec Chart.js scatter
        const categories = this.transactionManager.getUniqueCategories();
        const months = Utils.getLastNMonths(6);
        const data = [];

        categories.forEach((category, catIndex) => {
            months.forEach((month, monthIndex) => {
                const categoryTransactions = this.transactionManager.getTransactionsByMonth(
                    month.date.getFullYear(),
                    month.date.getMonth()
                ).filter(t => t.category === category && t.type === 'expense');

                const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
                
                if (total > 0) {
                    data.push({
                        x: monthIndex,
                        y: catIndex,
                        v: total
                    });
                }
            });
        });

        return {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Dépenses par catégorie',
                    data: data,
                    backgroundColor: function(context) {
                        const value = context.parsed.v;
                        const max = Math.max(...data.map(d => d.v));
                        const intensity = value / max;
                        return `rgba(255, 99, 132, ${intensity})`;
                    },
                    pointRadius: function(context) {
                        const value = context.parsed.v;
                        const max = Math.max(...data.map(d => d.v));
                        return 5 + (value / max) * 15;
                    }
                }]
            },
            options: {
                ...baseConfig,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        ticks: {
                            callback: function(value) {
                                return months[value]?.label || '';
                            },
                            stepSize: 1
                        },
                        min: 0,
                        max: months.length - 1
                    },
                    y: {
                        type: 'linear',
                        ticks: {
                            callback: function(value) {
                                return categories[value] || '';
                            },
                            stepSize: 1
                        },
                        min: 0,
                        max: categories.length - 1
                    }
                }
            }
        };
    }

    // ===== INSIGHTS AUTOMATIQUES =====

    async generateAutomaticInsights() {
        const insights = [];
        
        try {
            // Vérifier que les données sont disponibles
            if (!this.transactionManager || !this.predictionsAI) {
                return insights;
            }

            const transactions = this.transactionManager.getAllTransactions();
            if (transactions.length === 0) {
                return insights;
            }

            // Insight sur les tendances avec gestion d'erreur
            try {
                const trends = await this.analyzeTrendInsights();
                insights.push(...trends);
            } catch (error) {
                console.warn('Erreur lors de l\'analyse des tendances:', error);
            }

            // Insight sur les anomalies avec gestion d'erreur
            try {
                const anomalies = await this.analyzeAnomaliesInsights();
                insights.push(...anomalies);
            } catch (error) {
                console.warn('Erreur lors de l\'analyse des anomalies:', error);
            }

            // Insight sur les opportunités d'économie
            try {
                const savings = await this.analyzeSavingsInsights();
                insights.push(...savings);
            } catch (error) {
                console.warn('Erreur lors de l\'analyse d\'économies:', error);
            }

            // Insight sur les patterns de dépenses
            try {
                const patterns = await this.analyzePatternInsights();
                insights.push(...patterns);
            } catch (error) {
                console.warn('Erreur lors de l\'analyse des patterns:', error);
            }

        } catch (error) {
            console.error('Erreur générale lors de la génération des insights:', error);
        }

        return insights.sort((a, b) => b.importance - a.importance).slice(0, 5);
    }


    async analyzeTrendInsights() {
        const insights = [];
        
        try {
            const months = Utils.getLastNMonths(6);
            
            const monthlyExpenses = months.map(month => {
                try {
                    const stats = this.transactionManager.getMonthlyStats(
                        month.date.getFullYear(),
                        month.date.getMonth()
                    );
                    return stats.expenses || 0;
                } catch (error) {
                    console.warn('Erreur pour le mois:', month, error);
                    return 0;
                }
            });

            // Vérifier qu'on a des données valides
            const validExpenses = monthlyExpenses.filter(exp => exp > 0);
            if (validExpenses.length < 3) {
                return insights;
            }

            // Calcul de la tendance
            const trend = this.calculateTrend(monthlyExpenses);
            
            if (Math.abs(trend) > 5) {
                insights.push({
                    type: 'trend',
                    importance: 0.8,
                    icon: trend > 0 ? '📈' : '📉',
                    title: trend > 0 ? 'Dépenses en hausse' : 'Dépenses en baisse',
                    description: `Vos dépenses ${trend > 0 ? 'augmentent' : 'diminuent'} de ${Math.abs(trend).toFixed(1)}% par mois en moyenne`,
                    recommendation: trend > 0 ? 
                        'Surveillez vos catégories de dépenses les plus importantes' :
                        'Excellent ! Maintenez cette tendance positive',
                    value: `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`
                });
            }
        } catch (error) {
            console.error('Erreur dans analyzeTrendInsights:', error);
        }

        return insights;
    }

    async analyzeAnomaliesInsights() {
        const insights = [];
        const anomalies = await this.predictionsAI.detectAnomalies();
        
        if (anomalies.length > 0) {
            const highSeverityAnomalies = anomalies.filter(a => a.severity > 0.7);
            
            if (highSeverityAnomalies.length > 0) {
                insights.push({
                    type: 'anomaly',
                    importance: 0.9,
                    icon: '⚠️',
                    title: 'Transactions inhabituelles détectées',
                    description: `${highSeverityAnomalies.length} transaction(s) sortent de vos habitudes`,
                    recommendation: 'Vérifiez ces transactions pour détecter d\'éventuelles erreurs',
                    value: `${highSeverityAnomalies.length} alerte(s)`
                });
            }
        }

        return insights;
    }

    async analyzeSavingsInsights() {
        const insights = [];
        const categories = this.transactionManager.getUniqueCategories();
        
        // Analyser les catégories avec le plus de potentiel d'économie
        const savingsOpportunities = [];
        
        categories.forEach(category => {
            const categoryData = this.getCategoryTrendData(category);
            if (categoryData.trend > 10 && categoryData.total > 100) {
                savingsOpportunities.push({
                    category,
                    potential: categoryData.total * 0.1, // 10% d'économie potentielle
                    trend: categoryData.trend
                });
            }
        });

        if (savingsOpportunities.length > 0) {
            const topOpportunity = savingsOpportunities.sort((a, b) => b.potential - a.potential)[0];
            
            insights.push({
                type: 'savings',
                importance: 0.7,
                icon: '💰',
                title: 'Opportunité d\'économie identifiée',
                description: `En optimisant "${topOpportunity.category}", vous pourriez économiser jusqu'à ${Utils.formatCurrency(topOpportunity.potential)}`,
                recommendation: 'Analysez vos dépenses dans cette catégorie et recherchez des alternatives moins coûteuses',
                value: Utils.formatCurrency(topOpportunity.potential)
            });
        }

        return insights;
    }

    async analyzePatternInsights() {
        const insights = [];
        const recurring = await this.predictionsAI.predictRecurringExpenses();
        
        const highConfidenceRecurring = recurring.filter(r => r.confidence > 0.8);
        
        if (highConfidenceRecurring.length > 0) {
            insights.push({
                type: 'pattern',
                importance: 0.6,
                icon: '🔄',
                title: 'Dépenses récurrentes identifiées',
                description: `${highConfidenceRecurring.length} pattern(s) de dépenses récurrentes détecté(s)`,
                recommendation: 'Considérez la mise en place de budgets automatiques pour ces dépenses',
                value: `${highConfidenceRecurring.length} pattern(s)`
            });
        }

        return insights;
    }

    async updateInsights() {
        const container = document.getElementById('insights-container');
        if (!container) return;

        try {
            container.innerHTML = '<div class="insights-loading">Génération des insights...</div>';
            
            if (!this.predictionsAI) {
                container.innerHTML = `
                    <div class="no-insights">
                        <div class="no-insights-icon">⚠️</div>
                        <div class="no-insights-text">Moteur de prédictions non disponible</div>
                    </div>
                `;
                return;
            }
            
            const insights = await this.generateAutomaticInsights();
            
            if (insights.length === 0) {
                container.innerHTML = `
                    <div class="no-insights">
                        <div class="no-insights-icon">🤖</div>
                        <div class="no-insights-text">Aucun insight disponible pour le moment</div>
                        <div class="no-insights-subtitle">Plus de données amélioreront l'analyse</div>
                    </div>
                `;
                return;
            }

            const html = `
                <div class="insights-grid">
                    ${insights.map(insight => `
                        <div class="insight-card ${insight.type}" data-importance="${insight.importance}">
                            <div class="insight-header">
                                <div class="insight-icon">${insight.icon}</div>
                                <div class="insight-value">${insight.value}</div>
                            </div>
                            <div class="insight-content">
                                <h4 class="insight-title">${insight.title}</h4>
                                <p class="insight-description">${insight.description}</p>
                                <div class="insight-recommendation">
                                    <strong>Recommandation:</strong> ${insight.recommendation}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            container.innerHTML = html;
        } catch (error) {
            console.error('Erreur dans updateInsights:', error);
            container.innerHTML = `
                <div class="insights-error">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Erreur lors de la génération des insights</div>
                    <div class="error-details">${error.message}</div>
                </div>
            `;
        }
    }

    // ===== ALERTES ET NOTIFICATIONS =====

    async generateBudgetAlerts() {
        const alerts = [];
        const currentMonth = new Date();
        const stats = this.transactionManager.getMonthlyStats(
            currentMonth.getFullYear(),
            currentMonth.getMonth()
        );

        // Alerte de dépassement de budget
        if (stats.expenses > stats.income * 1.1) {
            alerts.push({
                type: 'budget_exceeded',
                severity: 'high',
                title: 'Dépassement budgétaire',
                description: `Vos dépenses (${Utils.formatCurrency(stats.expenses)}) dépassent vos revenus`,
                action: 'Réduire les dépenses non-essentielles'
            });
        }

        // Alerte de prédiction élevée
        try {
            const prediction = await this.predictionsAI.predictNextMonthExpenses();
            if (prediction.totalAmount > stats.expenses * 1.2) {
                alerts.push({
                    type: 'prediction_warning',
                    severity: 'medium',
                    title: 'Dépenses élevées prévues',
                    description: `Le mois prochain pourrait coûter ${Utils.formatCurrency(prediction.totalAmount)}`,
                    action: 'Planifier le budget du mois prochain'
                });
            }
        } catch (error) {
            console.error('Erreur lors de la prédiction pour les alertes:', error);
        }

        // Alerte de catégorie en explosion
        const categories = this.transactionManager.getUniqueCategories();
        categories.forEach(category => {
            const trend = this.getCategoryTrendData(category);
            if (trend.trend > 50) { // Plus de 50% d'augmentation
                alerts.push({
                    type: 'category_spike',
                    severity: 'medium',
                    title: `Explosion: ${category}`,
                    description: `Cette catégorie a augmenté de ${trend.trend.toFixed(1)}%`,
                    action: 'Analyser les dépenses de cette catégorie'
                });
            }
        });

        return alerts;
    }

    async updateDashboardAlerts() {
        const container = document.getElementById('dashboard-alerts');
        if (!container) return;

        const alerts = await this.generateBudgetAlerts();
        
        if (alerts.length === 0) {
            container.style.display = 'none';
            return;
        }

        const criticalAlerts = alerts.filter(a => a.severity === 'high').slice(0, 2);
        
        if (criticalAlerts.length > 0) {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="dashboard-alerts-content">
                    <div class="alerts-title">⚠️ Alertes importantes</div>
                    <div class="alerts-list">
                        ${criticalAlerts.map(alert => `
                            <div class="alert-item ${alert.severity}">
                                <div class="alert-content">
                                    <strong>${alert.title}</strong>: ${alert.description}
                                </div>
                                <button class="alert-dismiss" onclick="this.parentElement.style.display='none'">×</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            container.style.display = 'none';
        }
    }

    // ===== UTILITAIRES =====

    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
        
        return ((secondAvg - firstAvg) / firstAvg) * 100;
    }

    getCategoryTrendData(category) {
        const months = Utils.getLastNMonths(6);
        const monthlyTotals = months.map(month => {
            const transactions = this.transactionManager.getTransactionsByMonth(
                month.date.getFullYear(),
                month.date.getMonth()
            ).filter(t => t.category === category && t.type === 'expense');
            
            return transactions.reduce((sum, t) => sum + t.amount, 0);
        });

        const total = monthlyTotals.reduce((sum, val) => sum + val, 0);
        const trend = this.calculateTrend(monthlyTotals);

        return { total, trend };
    }

    getMonthComparison() {
        const currentMonth = new Date();
        const currentStats = this.transactionManager.getMonthlyStats(
            currentMonth.getFullYear(),
            currentMonth.getMonth()
        );
        
        const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
        const lastStats = this.transactionManager.getMonthlyStats(
            lastMonth.getFullYear(),
            lastMonth.getMonth()
        );

        if (lastStats.balance === 0) return 'N/A';
        
        const change = ((currentStats.balance - lastStats.balance) / Math.abs(lastStats.balance)) * 100;
        return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    }

    getComparisonClass(balance) {
        const comparison = parseFloat(this.getMonthComparison());
        if (isNaN(comparison)) return '';
        return comparison > 0 ? 'positive' : comparison < 0 ? 'negative' : 'neutral';
    }

    getTrendIcon(direction) {
        switch (direction) {
            case 'increasing': return '📈';
            case 'decreasing': return '📉';
            default: return '➡️';
        }
    }
	
    getTrendText(direction) {
        switch (direction) {
            case 'increasing': return 'Hausse';
            case 'decreasing': return 'Baisse';
            case 'stable': return 'Stable';
            default: return 'Indéterminé';
        }
    }


    getAlertIcon(type) {
        const icons = {
            budget_exceeded: '💸',
            prediction_warning: '🔮',
            category_spike: '📊',
            anomaly: '⚠️'
        };
        return icons[type] || '🔔';
    }

    renderTopCategories(breakdown) {
        if (!breakdown || Object.keys(breakdown).length === 0) {
            return '<div class="no-breakdown">Données insuffisantes</div>';
        }

        const sortedCategories = Object.entries(breakdown)
            .sort(([,a], [,b]) => b.predicted - a.predicted)
            .slice(0, 3);

        return sortedCategories.map(([category, data]) => `
            <div class="category-prediction">
                <span class="category-name">${category}</span>
                <span class="category-amount">${Utils.formatCurrency(data.predicted)}</span>
            </div>
        `).join('');
    }

    estimateGoalDate(current, goal) {
        if (current >= goal) return 'Objectif atteint !';
        
        const months = Utils.getLastNMonths(6);
        const monthlyBalances = months.map(month => {
            const stats = this.transactionManager.getMonthlyStats(
                month.date.getFullYear(),
                month.date.getMonth()
            );
            return stats.balance;
        });

        const avgMonthlySavings = monthlyBalances.reduce((sum, b) => sum + Math.max(0, b), 0) / monthlyBalances.length;
        
        if (avgMonthlySavings <= 0) return 'Impossible à estimer';
        
        const monthsNeeded = Math.ceil((goal - current) / avgMonthlySavings);
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + monthsNeeded);
        
        return targetDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }

    showWidgetError(content, error) {
        if (!content) return;
        
        const errorMessage = error?.message || 'Erreur inconnue';
        content.innerHTML = `
            <div class="widget-error">
                <div class="error-icon">❌</div>
                <div class="error-message">Erreur lors du chargement</div>
                <div class="error-details">${errorMessage}</div>
                <button class="retry-btn" onclick="window.calendar?.enhancedDashboard?.refreshWidget('${content.id.replace('content-', '')}')">
                    🔄 Réessayer
                </button>
            </div>
        `;
    }

    // ===== GESTION DES WIDGETS =====

    refreshWidget(widgetId) {
        try {
            const widget = this.widgets.get(widgetId);
            if (!widget) {
                console.warn(`Widget ${widgetId} non trouvé`);
                return;
            }

            const content = document.getElementById(`content-${widgetId}`);
            if (content) {
                content.innerHTML = '<div class="widget-loading">Actualisation...</div>';
            }

            // Vérifier que la fonction de rafraîchissement existe
            if (typeof widget.refreshFunction === 'function') {
                widget.refreshFunction();
                widget.lastUpdate = new Date();
            } else {
                console.error(`Fonction de rafraîchissement manquante pour ${widgetId}`);
                if (content) {
                    this.showWidgetError(content, new Error('Fonction de mise à jour manquante'));
                }
            }
        } catch (error) {
            console.error(`Erreur lors du rafraîchissement du widget ${widgetId}:`, error);
            const content = document.getElementById(`content-${widgetId}`);
            if (content) {
                this.showWidgetError(content, error);
            }
        }
    }


    refreshAllWidgets() {
        this.widgets.forEach((widget, widgetId) => {
            this.refreshWidget(widgetId);
        });
        
        this.updateInsights();
        this.updateDashboardAlerts();
    }

    updateAllWidgets() {
        if (!this.initialized) {
            console.log('Dashboard pas encore initialisé, report de la mise à jour');
            return;
        }

        if (!this.transactionManager) {
            console.warn('TransactionManager non disponible');
            return;
        }

        try {
            this.widgets.forEach((widget, widgetId) => {
                try {
                    this.refreshWidget(widgetId);
                } catch (error) {
                    console.error(`Erreur lors de la mise à jour du widget ${widgetId}:`, error);
                    this.showWidgetError(
                        document.getElementById(`content-${widgetId}`), 
                        new Error('Erreur de mise à jour')
                    );
                }
            });
            
            this.updateInsights();
            this.updateDashboardAlerts();
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour globale:', error);
        }
    }

    // ===== AUTO-REFRESH =====

    startAutoRefresh(intervalMinutes = 5) {
        if (!this.initialized) {
            console.log('Dashboard pas encore initialisé, auto-refresh reporté');
            return;
        }

        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            try {
                this.widgets.forEach((widget, widgetId) => {
                    const timeSinceUpdate = Date.now() - (widget.lastUpdate?.getTime() || 0);
                    const shouldRefresh = timeSinceUpdate > (intervalMinutes * 60 * 1000);
                    
                    if (shouldRefresh && widget.config.autoRefresh !== false) {
                        this.refreshWidget(widgetId);
                    }
                });
            } catch (error) {
                console.error('Erreur lors de l\'auto-refresh:', error);
            }
        }, intervalMinutes * 60 * 1000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
	
	// DIAGNOSTIQUE
    diagnose() {
        const diagnosis = {
            initialized: this.initialized,
            hasTransactionManager: !!this.transactionManager,
            hasPredictionsAI: !!this.predictionsAI,
            hasChartManager: !!this.chartManager,
            widgetsCount: this.widgets.size,
            dashboardContainer: !!document.getElementById('enhanced-dashboard'),
            errors: []
        };

        if (!this.transactionManager) {
            diagnosis.errors.push('TransactionManager manquant');
        }

        if (!this.predictionsAI) {
            diagnosis.errors.push('PredictionsAI manquant');
        }

        if (!this.chartManager) {
            diagnosis.errors.push('ChartManager manquant');
        }

        console.log('🔍 Diagnostic du Dashboard:', diagnosis);
        return diagnosis;
    }

    // ===== PERSONNALISATION =====

    openCustomizationPanel() {
        // Créer un modal de personnalisation
        const modal = document.createElement('div');
        modal.className = 'customization-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎨 Personnaliser le tableau de bord</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="customization-section">
                        <h4>Widgets visibles</h4>
                        <div class="widgets-list">
                            ${Array.from(this.widgets.entries()).map(([id, widget]) => `
                                <label class="widget-toggle">
                                    <input type="checkbox" ${widget.element.style.display !== 'none' ? 'checked' : ''} data-widget="${id}">
                                    <span>${widget.config.title}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="customization-section">
                        <h4>Paramètres</h4>
                        <label class="setting-item">
                            <span>Actualisation automatique (minutes)</span>
                            <input type="number" id="refresh-interval" value="5" min="1" max="60">
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary modal-cancel">Annuler</button>
                    <button class="btn-primary modal-save">Sauvegarder</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners pour le modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.modal-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.modal-save').addEventListener('click', () => {
            this.saveCustomization(modal);
            document.body.removeChild(modal);
        });
    }

    saveCustomization(modal) {
        // Sauvegarder la visibilité des widgets
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const widgetId = checkbox.dataset.widget;
            const widget = this.widgets.get(widgetId);
            if (widget) {
                widget.element.style.display = checkbox.checked ? 'block' : 'none';
            }
        });

        // Sauvegarder l'intervalle de rafraîchissement
        const refreshInterval = parseInt(modal.querySelector('#refresh-interval').value);
        if (refreshInterval && refreshInterval > 0) {
            this.startAutoRefresh(refreshInterval);
        }

        // Sauvegarder les préférences
        this.saveDashboardPreferences();
        
        Utils.showNotification('Paramètres sauvegardés', 'success');
    }

    saveDashboardPreferences() {
        const preferences = {
            widgets: Array.from(this.widgets.entries()).map(([id, widget]) => ({
                id,
                visible: widget.element.style.display !== 'none'
            })),
            refreshInterval: this.refreshInterval,
            savedAt: new Date().toISOString()
        };

        localStorage.setItem('dashboard-preferences', JSON.stringify(preferences));
    }

    loadDashboardPreferences() {
        try {
            const saved = localStorage.getItem('dashboard-preferences');
            if (!saved) return;

            const preferences = JSON.parse(saved);
            
            // Appliquer la visibilité des widgets
            if (preferences.widgets) {
                preferences.widgets.forEach(widgetPref => {
                    const widget = this.widgets.get(widgetPref.id);
                    if (widget) {
                        widget.element.style.display = widgetPref.visible ? 'block' : 'none';
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des préférences:', error);
        }
    }

    // ===== EXPORT =====

    exportDashboard() {
        const dashboardData = {
            summary: this.getDashboardSummary(),
            widgets: this.getWidgetsData(),
            insights: this.getInsightsData(),
            exportDate: new Date().toISOString()
        };

        // Export en JSON
        const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard_export_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    }

    getDashboardSummary() {
        const stats = this.transactionManager.getTotalStats();
        const currentMonth = this.transactionManager.getMonthlyStats(
            new Date().getFullYear(),
            new Date().getMonth()
        );

        return {
            totalBalance: stats.totalBalance,
            monthlyIncome: currentMonth.income,
            monthlyExpenses: currentMonth.expenses,
            monthlyBalance: currentMonth.balance,
            totalTransactions: stats.totalTransactions
        };
    }

    getWidgetsData() {
        const data = {};
        this.widgets.forEach((widget, id) => {
            data[id] = {
                title: widget.config.title,
                type: widget.config.type,
                lastUpdate: widget.lastUpdate,
                visible: widget.element.style.display !== 'none'
            };
        });
        return data;
    }

    getInsightsData() {
        const container = document.getElementById('insights-container');
        const insights = container?.querySelectorAll('.insight-card') || [];
        
        return Array.from(insights).map(insight => ({
            type: insight.className.split(' ').find(c => c !== 'insight-card'),
            title: insight.querySelector('.insight-title')?.textContent,
            description: insight.querySelector('.insight-description')?.textContent,
            value: insight.querySelector('.insight-value')?.textContent,
            importance: insight.dataset.importance
        }));
    }

    // ===== DESTRUCTION =====

    destroy() {
        this.stopAutoRefresh();
        
        // Détruire les instances de graphiques
        this.widgets.forEach(widget => {
            if (widget.chartInstance) {
                widget.chartInstance.destroy();
            }
        });

        // Nettoyer les event listeners
        const modal = document.getElementById('fullscreen-chart-modal');
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }

        this.widgets.clear();
    }
}