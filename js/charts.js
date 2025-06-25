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
    
    // Pas besoin de Plotly pour categoryChart seulement
    
    try {
        // Vérifier que le transaction manager est disponible
        if (!this.transactionManager) {
            throw new Error('TransactionManager non disponible');
        }

        // SUPPRIMER CES APPELS :
        // this.createBudgetChart();
        // this.createModernBarChart();
        // this.create3DChart();
        
        // GARDER SEULEMENT l'initialisation basique
        this.initialized = true;
        console.log('✅ Charts manager initialisé (category chart seulement)');
        
        // Mise à jour initiale
        setTimeout(() => {
            this.updateCategoryChart();
        }, 100);
        
        return true;
    } catch (error) {
        console.error(`❌ Erreur lors de l'initialisation (tentative ${this.initializationAttempts}):`, error);
        
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
            'category': 'categoryChart'
        };

        const containerId = containers[chartName];
		
		if (containerId) {
			const container = document.getElementById(containerId);
			if (container) {
				container.innerHTML = `
					<div class="chart-error">
						<div class="error-icon">⚠️</div>
						<div class="error-message">Erreur de graphique: ${error.message}</div>
					</div>
				`;
			}
		}		
	}

    // ===== CATEGORY CHART (Custom dots visualization) =====
    updateCategoryChart(year = null, month = null) {
		const container = document.getElementById('categoryChart');
		if (!container) {
			console.warn('Conteneur categoryChart non trouvé');
			return;
		}
	
		try {
			// Utiliser la date fournie ou la date actuelle
			const targetYear = year || new Date().getFullYear();
			const targetMonth = month !== null ? month : new Date().getMonth();
			
			// Filtrer les transactions du mois ciblé
			const monthTransactions = this.transactionManager.getTransactionsByMonth(targetYear, targetMonth);
			const monthExpenses = monthTransactions.filter(t => t.type === 'expense');
	
			if (monthExpenses.length === 0) {
				container.innerHTML = `
					<div class="no-chart-data">
						<div class="no-data-icon">📊</div>
						<div class="no-data-text">Aucune dépense pour ${new Date(targetYear, targetMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
					</div>
				`;
				return;
			}

			// Calculer les totaux par catégorie
			const categoryTotals = {};
			monthExpenses.forEach(t => {
				categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
			});

			const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
			const sortedCategories = Object.entries(categoryTotals)
				.sort(([,a], [,b]) => b - a)
				.slice(0, 10);

			if (sortedCategories.length === 0) {
				container.innerHTML = `
					<div class="no-chart-data">
						<div class="no-data-icon">📊</div>
						<div class="no-data-text">Aucune donnée à afficher</div>
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
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour du thème des charts:', error);
        }
   }

}