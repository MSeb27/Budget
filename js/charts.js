// ===== CHARTS MANAGER =====
class ChartsManager {
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
        this.charts = {};
        this.initialized = false;
    }

    // ===== INITIALIZATION =====
    async init() {
        if (typeof Chart === 'undefined') {
            console.log('Chart.js not loaded yet, retrying...');
            setTimeout(() => this.init(), 200);
            return;
        }
        
        if (typeof Plotly === 'undefined') {
            console.log('Plotly.js not loaded yet, retrying...');
            setTimeout(() => this.init(), 200);
            return;
        }
        
        try {
            this.createBudgetChart();
            this.createModernBarChart();
            this.create3DChart();
            
            this.initialized = true;
            this.updateAllCharts();
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    updateAllCharts() {
        if (!this.initialized) return;
        
        try {
            this.updateCategoryChart();
            this.updateBudgetChart();
            this.updateModernBarChart();
            this.update3DChart();
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    // ===== CATEGORY CHART (Custom dots visualization) =====
    updateCategoryChart() {
        const container = document.getElementById('categoryChart');
        if (!container) return;
        
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

        const colors = Utils.generateRainbowColors(sortedCategories.length);

        let html = '';
        
        if (sortedCategories.length === 0) {
            html = '<div style="text-align: center; color: #6c757d; padding: 40px;">Aucune dépense ce mois-ci</div>';
        } else {
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
        }

        container.innerHTML = html;
    }

    // ===== BUDGET CHART (Line chart with cumulative balance) =====
    createBudgetChart() {
        const ctx = document.getElementById('budgetChart');
        if (!ctx) return;

        this.charts.budget = new Chart(ctx.getContext('2d'), {
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
    }

    updateBudgetChart() {
        if (!this.charts.budget) return;
        
        const months = Utils.getLastNMonths(12);
        const labels = months.map(m => m.label);
        const balanceData = [];
        
        let cumulativeBalance = 0;
        months.forEach(month => {
            const stats = this.transactionManager.getMonthlyStats(
                month.date.getFullYear(), 
                month.date.getMonth()
            );
            cumulativeBalance += stats.balance;
            balanceData.push(cumulativeBalance);
        });
        
        this.charts.budget.data.labels = labels;
        this.charts.budget.data.datasets[0].data = balanceData;
        
        // Couleurs dynamiques selon les valeurs positives/négatives
        const pointColors = balanceData.map(value => value >= 0 ? '#3742FA' : '#FF4757');
        this.charts.budget.data.datasets[0].pointBackgroundColor = pointColors;
        
        this.charts.budget.update();
    }

    // ===== MODERN BAR CHART (12 months categories) =====
    createModernBarChart() {
        // Pas besoin de créer un chart.js, c'est un chart custom HTML/CSS
        this.charts.modernBar = { initialized: true };
    }

    updateModernBarChart() {
        const container = document.getElementById('modernBarsContainer');
        if (!container) return;

        // Calculer les données des 12 derniers mois
        const months = Utils.getLastNMonths(12);
        const categoryData = {};
        
        // Collecter toutes les dépenses des 12 derniers mois
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

        // Trier les catégories par montant total
        const sortedCategories = Object.entries(categoryData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10 catégories

        if (sortedCategories.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 40px;">Aucune dépense sur les 12 derniers mois</div>';
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
    }

    // ===== 3D CHART (Temporal surface chart) =====
    create3DChart() {
        this.charts.temporal3D = { initialized: true };
    }

    update3DChart() {
        const container = document.getElementById('temporal3DChart');
        if (!container) return;

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
            container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 400px; color: #6c757d; font-style: italic;">Aucune dépense à afficher</div>';
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
                const monthData = months[monthIndex];
                const monthExpenses = this.transactionManager.getTransactionsByMonth(
                    monthData.date.getFullYear(),
                    monthData.date.getMonth()
                ).filter(t => t.type === 'expense' && t.category === allCategories[catIndex]);

                const total = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
                row.push(total);
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
    }

    // ===== CHART UTILITIES =====
    resizeCharts() {
        if (!this.initialized) return;
        
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
        
        // Redraw Plotly charts
        if (document.getElementById('temporal3DChart')) {
            Plotly.Plots.resize(document.getElementById('temporal3DChart'));
        }
    }

    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
        this.initialized = false;
    }

    // ===== EXPORT CHART DATA =====
    exportChartData(chartType) {
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
    }

    getBudgetData() {
        const months = Utils.getLastNMonths(12);
        let cumulativeBalance = 0;
        
        return months.map(month => {
            const stats = this.transactionManager.getMonthlyStats(
                month.date.getFullYear(), 
                month.date.getMonth()
            );
            cumulativeBalance += stats.balance;
            
            return {
                month: month.fullLabel,
                income: stats.income,
                expenses: stats.expenses,
                balance: stats.balance,
                cumulativeBalance: cumulativeBalance
            };
        });
    }

    getCategoryData() {
        const now = new Date();
        return this.transactionManager.getCategoryStats(
            new Date(now.getFullYear(), now.getMonth(), 1),
            new Date(now.getFullYear(), now.getMonth() + 1, 0)
        );
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

    // ===== THEME ADAPTATION =====
    updateChartsTheme() {
        if (!this.initialized) return;
        
        const themeColors = ThemeManager.getThemeColors();
        
        // Update Chart.js charts
        if (this.charts.budget) {
            this.charts.budget.data.datasets[0].borderColor = themeColors.primary;
            this.charts.budget.data.datasets[0].backgroundColor = themeColors.primary + '20';
            this.charts.budget.update();
        }
        
        // Update custom charts will happen automatically via CSS variables
        this.updateCategoryChart();
        this.updateModernBarChart();
        
        // Update 3D chart
        setTimeout(() => {
            this.update3DChart();
        }, 100);
    }
}