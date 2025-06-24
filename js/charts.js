// ===== CHARTS MANAGER =====
class ChartsManager {
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
        this.charts = {};
        this.initialized = false;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 5;
    }


    // ===== INITIALIZATION =====
    async init() {
        this.initializationAttempts++;
        
        if (this.initializationAttempts > this.maxInitializationAttempts) {
            console.error('❌ Échec de l\'initialisation des charts après', this.maxInitializationAttempts, 'tentatives');
            return false;
        }

        // Vérifier que Chart.js est chargé
        if (typeof Chart === 'undefined') {
            console.log(`Chart.js pas encore chargé, tentative ${this.initializationAttempts}/${this.maxInitializationAttempts}...`);
            setTimeout(() => this.init(), 500);
            return false;
        }
        
        // Vérifier que Plotly est chargé
        if (typeof Plotly === 'undefined') {
            console.log(`Plotly.js pas encore chargé, tentative ${this.initializationAttempts}/${this.maxInitializationAttempts}...`);
            setTimeout(() => this.init(), 500);
            return false;
        }
        
        try {
            // Vérifier que le transaction manager est disponible
            if (!this.transactionManager) {
                throw new Error('TransactionManager non disponible');
            }

            this.createBudgetChart();
            this.createModernBarChart();
            this.create3DChart();
            
            this.initialized = true;
            console.log('✅ Charts initialisés avec succès');
            
            // Mise à jour initiale
            setTimeout(() => {
                this.updateAllCharts();
            }, 100);
            
            return true;
        } catch (error) {
            console.error(`❌ Erreur lors de l'initialisation des charts (tentative ${this.initializationAttempts}):`, error);
            
            // Retry avec un délai plus long
            if (this.initializationAttempts < this.maxInitializationAttempts) {
                setTimeout(() => this.init(), 1000);
            }
            return false;
        }
    }

    updateAllCharts() {
        if (!this.initialized) {
            console.log('Charts pas encore initialisés');
            return false;
        }
        
        if (!this.transactionManager) {
            console.warn('TransactionManager non disponible pour la mise à jour des charts');
            return false;
        }
        
        try {
            // Mettre à jour chaque chart individuellement avec gestion d'erreur
            this.safeUpdateChart('category', () => this.updateCategoryChart());
            this.safeUpdateChart('budget', () => this.updateBudgetChart());
            this.safeUpdateChart('modernBar', () => this.updateModernBarChart());
            this.safeUpdateChart('3d', () => this.update3DChart());
            
            console.log('✅ Charts mis à jour');
            return true;
        } catch (error) {
            console.error('❌ Erreur globale lors de la mise à jour des charts:', error);
            return false;
        }
    }


    safeUpdateChart(chartName, updateFunction) {
        try {
            updateFunction();
        } catch (error) {
            console.error(`❌ Erreur lors de la mise à jour du chart ${chartName}:`, error);
            this.showChartError(chartName, error);
        }
    }

    // Affichage erreurs de chart
    showChartError(chartName, error) {
        const containers = {
            'category': 'categoryChart',
            'budget': 'budgetChart',
            'modernBar': 'modernBarsContainer',
            '3d': 'temporal3DChart'
        };

        const containerId = containers[chartName];
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="chart-error">
                        <div class="error-icon">📊❌</div>
                        <div class="error-title">Erreur de graphique</div>
                        <div class="error-message">${error.message}</div>
                        <button onclick="window.calendar?.chartManager?.safeUpdateChart('${chartName}', () => window.calendar.chartManager.update${chartName.charAt(0).toUpperCase() + chartName.slice(1)}Chart())">
                            🔄 Réessayer
                        </button>
                    </div>
                `;
            }
        }
    }

    // ===== CATEGORY CHART (Custom dots visualization) =====
    updateCategoryChart() {
        const container = document.getElementById('categoryChart');
        if (!container) {
            console.warn('Conteneur categoryChart non trouvé');
            return;
        }
        
        try {
            const now = new Date();
            const monthExpenses = this.transactionManager.getTransactionsByMonth(
                now.getFullYear(), 
                now.getMonth()
            ).filter(t => t.type === 'expense');

            const categoryTotals = {};
            monthExpenses.forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

            const sortedCategories = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a);

            const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

            // Vérifier qu'on a des données
            if (sortedCategories.length === 0) {
                container.innerHTML = `
                    <div class="no-chart-data">
                        <div class="no-data-icon">📊</div>
                        <div class="no-data-text">Aucune dépense ce mois-ci</div>
                        <div class="no-data-subtitle">Ajoutez des transactions pour voir le graphique</div>
                    </div>
                `;
                return;
            }

            const colors = Utils.generateRainbowColors(sortedCategories.length);

            let html = '';
            sortedCategories.forEach(([category, amount], index) => {
                const percentage = ((amount / total) * 100).toFixed(1);
                const color = colors[index];
                
                const maxDots = 20;
                const dotCount = Math.max(1, Math.round((amount / total) * maxDots));
                
                let dots = '';
                for (let i = 0; i < dotCount; i++) {
                    dots += `<div class="category-dot" style="background-color: ${color}"></div>`;
                }
                
                html += `
                    <div class="category-item">
                        <div class="category-number">${String(index + 1).padStart(2, '0')}</div>
                        <div class="category-name">${category}</div>
                        <div class="category-dots">${dots}</div>
                        <div class="category-amount">${Utils.formatCurrency(amount)}</div>
                        <div class="category-percentage">${percentage}%</div>
                    </div>
                `;
            });

            container.innerHTML = html;
        } catch (error) {
            console.error('Erreur dans updateCategoryChart:', error);
            this.showChartError('category', error);
        }
    }

    // ===== BUDGET CHART (Line chart with cumulative balance) =====
    createBudgetChart() {
        const canvas = document.getElementById('budgetChart');
        if (!canvas) {
            console.warn('Canvas budgetChart non trouvé');
            return;
        }

        try {
            const ctx = canvas.getContext('2d');
            
            // Détruire le chart existant s'il y en a un
            if (this.charts.budget) {
                this.charts.budget.destroy();
            }

            this.charts.budget = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Solde fin de mois',
                        data: [],
                        backgroundColor: 'rgba(55, 66, 250, 0.1)',
                        borderColor: '#3742FA',
                        borderWidth: 3,
                        tension: 0.4,
                        pointBackgroundColor: '#3742FA',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 3,
                        pointRadius: 8,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#fff',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    return `Solde: ${value >= 0 ? '+' : ''}${Utils.formatCurrency(value)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    weight: 'bold'
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return (value >= 0 ? '+' : '') + value + '€';
                                },
                                font: {
                                    weight: 'bold'
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erreur dans createBudgetChart:', error);
            this.showChartError('budget', error);
        }
    }

    updateBudgetChart() {
        if (!this.charts.budget) {
            console.warn('Chart budget non initialisé');
            return;
        }
        
        try {
            const months = Utils.getLastNMonths(12);
            const labels = months.map(m => m.label);
            const balanceData = [];
            
            let cumulativeBalance = 0;
            months.forEach(month => {
                try {
                    const stats = this.transactionManager.getMonthlyStats(
                        month.date.getFullYear(), 
                        month.date.getMonth()
                    );
                    cumulativeBalance += stats.balance || 0;
                    balanceData.push(cumulativeBalance);
                } catch (error) {
                    console.warn('Erreur pour le mois:', month, error);
                    balanceData.push(cumulativeBalance); // Garde la valeur précédente
                }
            });
            
            this.charts.budget.data.labels = labels;
            this.charts.budget.data.datasets[0].data = balanceData;
            
            // Couleurs dynamiques selon les valeurs positives/négatives
            const pointColors = balanceData.map(value => value >= 0 ? '#3742FA' : '#FF4757');
            this.charts.budget.data.datasets[0].pointBackgroundColor = pointColors;
            
            this.charts.budget.update();
        } catch (error) {
            console.error('Erreur dans updateBudgetChart:', error);
            this.showChartError('budget', error);
        }
    }

    // ===== MODERN BAR CHART (12 months categories) =====
    createModernBarChart() {
        // Pas besoin de créer un chart.js, c'est un chart custom HTML/CSS
        this.charts.modernBar = { initialized: true };
    }

    updateModernBarChart() {
        const container = document.getElementById('modernBarsContainer');
        if (!container) {
            console.warn('Conteneur modernBarsContainer non trouvé');
            return;
        }

        try {
            // Calculer les données des 12 derniers mois
            const months = Utils.getLastNMonths(12);
            const categoryData = {};
            
            // Collecter toutes les dépenses des 12 derniers mois
            months.forEach(month => {
                try {
                    const monthTransactions = this.transactionManager.getTransactionsByMonth(
                        month.date.getFullYear(), 
                        month.date.getMonth()
                    ).filter(t => t.type === 'expense');

                    monthTransactions.forEach(t => {
                        if (!categoryData[t.category]) {
                            categoryData[t.category] = 0;
                        }
                        categoryData[t.category] += t.amount;
                    });
                } catch (error) {
                    console.warn('Erreur pour le mois:', month, error);
                }
            });

            // Trier les catégories par montant total
            const sortedCategories = Object.entries(categoryData)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10); // Top 10 catégories

            if (sortedCategories.length === 0) {
                container.innerHTML = `
                    <div class="no-chart-data">
                        <div class="no-data-icon">📊</div>
                        <div class="no-data-text">Aucune dépense sur les 12 derniers mois</div>
                    </div>
                `;
                return;
            }

            const maxAmount = Math.max(...sortedCategories.map(([,amount]) => amount));
            
            let html = '';
            sortedCategories.forEach(([category, amount], index) => {
                const heightPercent = (amount / maxAmount) * 100;
                const barHeight = Math.max(20, heightPercent * 2.5); // Min 20px, max 250px
                
                html += `
                    <div class="chart-bar">
                        <div class="bar-visual" style="height: ${barHeight}px;">
                            <div class="bar-value">${Utils.formatCurrency(amount, '')}</div>
                        </div>
                        <div class="bar-label">${category}</div>
                    </div>
                `;
            });

            container.innerHTML = html;
        } catch (error) {
            console.error('Erreur dans updateModernBarChart:', error);
            this.showChartError('modernBar', error);
        }
    }

    // ===== 3D CHART (Temporal surface chart) =====
    create3DChart() {
        this.charts.temporal3D = { initialized: true };
    }

    update3DChart() {
        const container = document.getElementById('temporal3DChart');
        if (!container) {
            console.warn('Conteneur temporal3DChart non trouvé');
            return;
        }

        try {
            // Générer les 6 derniers mois
            const months = Utils.getLastNMonths(6);
            
            // Obtenir toutes les catégories d'expenses
            const allCategories = this.transactionManager.getUniqueCategories()
                .filter(cat => {
                    // Vérifier qu'il y a au moins une dépense pour cette catégorie
                    return this.transactionManager.getTransactionsByCategory(cat)
                        .some(t => t.type === 'expense');
                });

            if (allCategories.length === 0) {
                container.innerHTML = `
                    <div class="no-chart-data">
                        <div class="no-data-icon">📊</div>
                        <div class="no-data-text">Aucune dépense à afficher</div>
                    </div>
                `;
                return;
            }

            // Créer la matrice de données
            const x = months.map(m => m.label);
            const y = allCategories;
            const z = [];

            // Créer la matrice Z pour la surface
            for (let catIndex = 0; catIndex < allCategories.length; catIndex++) {
                const row = [];
                for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
                    try {
                        const monthData = months[monthIndex];
                        const monthExpenses = this.transactionManager.getTransactionsByMonth(
                            monthData.date.getFullYear(),
                            monthData.date.getMonth()
                        ).filter(t => t.type === 'expense' && t.category === allCategories[catIndex]);

                        const total = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
                        row.push(total);
                    } catch (error) {
                        console.warn('Erreur pour catégorie/mois:', allCategories[catIndex], months[monthIndex], error);
                        row.push(0);
                    }
                }
                z.push(row);
            }

            const data = [{
                x: x,
                y: y,
                z: z,
                type: 'surface',
                colorscale: [
                    [0, '#E3F2FD'],
                    [0.2, '#BBDEFB'], 
                    [0.4, '#90CAF9'],
                    [0.6, '#64B5F6'],
                    [0.8, '#2196F3'],
                    [1, '#1976D2']
                ],
                showscale: true,
                colorbar: {
                    title: 'Montant (€)',
                    titlefont: { color: '#495057' },
                    tickfont: { color: '#495057' }
                }
            }];

            const layout = {
                title: {
                    text: 'Évolution des dépenses par catégorie',
                    font: { size: 14, color: '#495057' }
                },
                scene: {
                    xaxis: { 
                        title: 'Mois', 
                        titlefont: { color: '#495057' },
                        tickfont: { color: '#495057' }
                    },
                    yaxis: { 
                        title: 'Catégories', 
                        titlefont: { color: '#495057' },
                        tickfont: { color: '#495057' }
                    },
                    zaxis: { 
                        title: 'Montant (€)', 
                        titlefont: { color: '#495057' },
                        tickfont: { color: '#495057' }
                    },
                    camera: {
                        eye: { x: 1.5, y: 1.5, z: 1.2 }
                    }
                },
                margin: { l: 0, r: 0, b: 40, t: 40 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Segoe UI, sans-serif', color: '#495057' }
            };

            const config = {
                displayModeBar: true,
                modeBarButtons: [['zoom3d', 'pan3d', 'orbitRotation', 'resetCameraDefault3d']],
                displaylogo: false,
                responsive: true
            };

            Plotly.newPlot(container, data, layout, config);
        } catch (error) {
            console.error('Erreur dans update3DChart:', error);
            this.showChartError('3d', error);
        }
    }

    create3DChart() {
        this.charts.temporal3D = { initialized: true };
    }

    createModernBarChart() {
        this.charts.modernBar = { initialized: true };
    }
	
	
    // ===== CHART UTILITIES =====
    resizeCharts() {
        if (!this.initialized) return;
        
        try {
            Object.values(this.charts).forEach(chart => {
                if (chart && chart.resize) {
                    chart.resize();
                }
            });
            
            // Redraw Plotly charts
            if (document.getElementById('temporal3DChart')) {
                try {
                    Plotly.Plots.resize(document.getElementById('temporal3DChart'));
                } catch (error) {
                    console.warn('Erreur lors du redimensionnement Plotly:', error);
                }
            }
        } catch (error) {
            console.error('Erreur lors du redimensionnement des charts:', error);
        }
    }

    destroyCharts() {
        try {
            Object.values(this.charts).forEach(chart => {
                if (chart && chart.destroy) {
                    chart.destroy();
                }
            });
            this.charts = {};
            this.initialized = false;
            console.log('✅ Charts détruits');
        } catch (error) {
            console.error('Erreur lors de la destruction des charts:', error);
        }
    }

    diagnose() {
        const diagnosis = {
            initialized: this.initialized,
            hasTransactionManager: !!this.transactionManager,
            chartJsLoaded: typeof Chart !== 'undefined',
            plotlyLoaded: typeof Plotly !== 'undefined',
            chartsCount: Object.keys(this.charts).length,
            containers: {
                categoryChart: !!document.getElementById('categoryChart'),
                budgetChart: !!document.getElementById('budgetChart'),
                modernBarsContainer: !!document.getElementById('modernBarsContainer'),
                temporal3DChart: !!document.getElementById('temporal3DChart')
            },
            initializationAttempts: this.initializationAttempts,
            errors: []
        };

        if (!this.transactionManager) {
            diagnosis.errors.push('TransactionManager manquant');
        }

        if (typeof Chart === 'undefined') {
            diagnosis.errors.push('Chart.js non chargé');
        }

        if (typeof Plotly === 'undefined') {
            diagnosis.errors.push('Plotly.js non chargé');
        }

        Object.entries(diagnosis.containers).forEach(([name, exists]) => {
            if (!exists) {
                diagnosis.errors.push(`Conteneur ${name} manquant`);
            }
        });

        console.log('🔍 Diagnostic ChartManager:', diagnosis);
        return diagnosis;
    }

    forceReinit() {
        console.log('🔄 Réinitialisation forcée des charts...');
        this.destroyCharts();
        this.initialized = false;
        this.initializationAttempts = 0;
        
        setTimeout(() => {
            this.init();
        }, 500);
    }

    // ===== EXPORT CHART DATA =====
    exportChartData(chartType) {
        try {
            switch (chartType) {
                case 'budget':
                    return this.getBudgetData();
                case 'category':
                    return this.getCategoryData();
                case 'modernBar':
                    return this.getModernBarData();
                case '3d':
                    return this.get3DData();
                default:
                    return null;
            }
        } catch (error) {
            console.error(`Erreur lors de l'export des données ${chartType}:`, error);
            return null;
        }
    }

    getBudgetData() {
        const months = Utils.getLastNMonths(12);
        let cumulativeBalance = 0;
        
        return months.map(month => {
            try {
                const stats = this.transactionManager.getMonthlyStats(
                    month.date.getFullYear(), 
                    month.date.getMonth()
                );
                cumulativeBalance += stats.balance || 0;
                
                return {
                    month: month.fullLabel,
                    income: stats.income || 0,
                    expenses: stats.expenses || 0,
                    balance: stats.balance || 0,
                    cumulativeBalance: cumulativeBalance
                };
            } catch (error) {
                console.warn('Erreur export budget pour mois:', month, error);
                return {
                    month: month.fullLabel,
                    income: 0,
                    expenses: 0,
                    balance: 0,
                    cumulativeBalance: cumulativeBalance
                };
            }
        });
    }

    getCategoryData() {
        try {
            const now = new Date();
            return this.transactionManager.getCategoryStats(
                new Date(now.getFullYear(), now.getMonth(), 1),
                new Date(now.getFullYear(), now.getMonth() + 1, 0)
            );
        } catch (error) {
            console.error('Erreur export catégories:', error);
            return [];
        }
    }


    getModernBarData() {
        const months = Utils.getLastNMonths(12);
        const categoryData = {};
        
        months.forEach(month => {
            const monthTransactions = this.transactionManager.getTransactionsByMonth(
                month.date.getFullYear(), 
                month.date.getMonth()
            ).filter(t => t.type === 'expense');

            monthTransactions.forEach(t => {
                if (!categoryData[t.category]) {
                    categoryData[t.category] = 0;
                }
                categoryData[t.category] += t.amount;
            });
        });

        return Object.entries(categoryData)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }

    get3DData() {
        const months = Utils.getLastNMonths(6);
        const allCategories = this.transactionManager.getUniqueCategories();
        
        const data = [];
        months.forEach(month => {
            allCategories.forEach(category => {
                const monthExpenses = this.transactionManager.getTransactionsByMonth(
                    month.date.getFullYear(),
                    month.date.getMonth()
                ).filter(t => t.type === 'expense' && t.category === category);

                const total = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
                
                data.push({
                    month: month.label,
                    category: category,
                    amount: total
                });
            });
        });

        return data;
    }
	
	    validateDataForCharts() {
        const validation = {
            valid: true,
            issues: [],
            recommendations: []
        };

        try {
            if (!this.transactionManager) {
                validation.valid = false;
                validation.issues.push('TransactionManager non disponible');
                return validation;
            }

            const transactions = this.transactionManager.getAllTransactions();
            
            if (transactions.length === 0) {
                validation.issues.push('Aucune transaction disponible');
                validation.recommendations.push('Ajoutez des transactions pour voir les graphiques');
            }

            if (transactions.length < 3) {
                validation.issues.push('Peu de transactions disponibles');
                validation.recommendations.push('Ajoutez plus de transactions pour des graphiques plus significatifs');
            }

            const categories = this.transactionManager.getUniqueCategories();
            if (categories.length < 2) {
                validation.issues.push('Peu de catégories utilisées');
                validation.recommendations.push('Utilisez plus de catégories pour une meilleure analyse');
            }

            const months = Utils.getLastNMonths(6);
            const monthsWithData = months.filter(month => {
                const monthTransactions = this.transactionManager.getTransactionsByMonth(
                    month.date.getFullYear(),
                    month.date.getMonth()
                );
                return monthTransactions.length > 0;
            });

            if (monthsWithData.length < 3) {
                validation.issues.push('Données sur peu de mois');
                validation.recommendations.push('Continuez à enregistrer des transactions pour voir les tendances');
            }

        } catch (error) {
            validation.valid = false;
            validation.issues.push('Erreur lors de la validation: ' + error.message);
        }

        return validation;
    }

    // ===== THEME ADAPTATION =====
    updateChartsTheme() {
        if (!this.initialized) return;
        
        try {
            const themeColors = ThemeManager?.getThemeColors() || {};
            
            // Update Chart.js charts
            if (this.charts.budget) {
                this.charts.budget.data.datasets[0].borderColor = themeColors.primary || '#3742FA';
                this.charts.budget.data.datasets[0].backgroundColor = (themeColors.primary || '#3742FA') + '20';
                this.charts.budget.update();
            }
            
            // Update custom charts will happen automatically via CSS variables
            this.updateCategoryChart();
            this.updateModernBarChart();
            
            // Update 3D chart
            setTimeout(() => {
                this.update3DChart();
            }, 100);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du thème des charts:', error);
        }
   }

}