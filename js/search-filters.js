// ===== GESTIONNAIRE DE RECHERCHE ET FILTRES AVANCÉS =====
class AdvancedSearchManager {
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
        this.currentFilters = {
            search: '',
            categories: [],
            types: [],
            dateRange: { start: null, end: null },
            amountRange: { min: null, max: null },
            tags: [],
            sortBy: 'date',
            sortOrder: 'desc'
        };
        this.searchHistory = [];
        this.savedFilters = this.loadSavedFilters();
        this.lastFilteredResults = [];
        this.initializeElements();
        this.setupEventListeners();
        this.generateCategoryOptions();
    }

    // ===== INITIALISATION =====
    initializeElements() {
        this.elements = {
            searchInput: document.getElementById('search-input') || document.getElementById('advanced-search-input'),
            filterPanel: document.getElementById('filter-panel'),
            categoryFilters: document.getElementById('category-filters'),
            typeFilters: document.getElementById('type-filters'),
            dateRangeStart: document.getElementById('date-range-start'),
            dateRangeEnd: document.getElementById('date-range-end'),
            amountMin: document.getElementById('amount-min'),
            amountMax: document.getElementById('amount-max'),
            sortSelect: document.getElementById('sort-select'),
            sortOrder: document.getElementById('sort-order'),
            resultsContainer: document.getElementById('search-results'),
            resultsCount: document.getElementById('results-count'),
            saveFilterBtn: document.getElementById('save-filter'),
            clearFiltersBtn: document.getElementById('clear-filters'),
            filterPresets: document.getElementById('filter-presets'),
            quickFilters: document.getElementById('quick-filters')
        };

        console.log('🔍 Éléments de recherche initialisés:', {
            searchInput: !!this.elements.searchInput,
            filterPanel: !!this.elements.filterPanel,
            categoryFilters: !!this.elements.categoryFilters,
            quickFilters: !!this.elements.quickFilters
        });
    }

    // ===== GÉNÉRATION DES OPTIONS DE CATÉGORIES =====
    generateCategoryOptions() {
        if (!this.elements.categoryFilters) {
            console.warn('⚠️ Élément category-filters introuvable');
            return;
        }

        try {
            const categories = this.getAllCategories();
            
            if (categories.length === 0) {
                console.warn('⚠️ Aucune catégorie trouvée');
                return;
            }

            const categoryHTML = categories.map(category => `
                <label class="filter-checkbox">
                    <input type="checkbox" value="${category}" />
                    <span>${this.getCategoryIcon(category)} ${category}</span>
                </label>
            `).join('');

            this.elements.categoryFilters.innerHTML = categoryHTML;
            console.log('✅ Options de catégories générées:', categories.length);

        } catch (error) {
            console.error('❌ Erreur lors de la génération des catégories:', error);
        }
    }

    // ===== MÉTHODE REFRESH POUR L'ONGLET RECHERCHE =====
    refresh() {
        console.log('🔄 Actualisation du gestionnaire de recherche...');
        
        try {
            this.initializeElements();
            this.generateCategoryOptions();
            this.createQuickFilters();
            this.applyFilters();
            this.updateFilterPresets();
            
            console.log('✅ Recherche actualisée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'actualisation de la recherche:', error);
        }
    }

    // Récupérer toutes les catégories
    getAllCategories() {
        try {
            if (!this.transactionManager) {
                console.warn('⚠️ TransactionManager non disponible');
                return [];
            }

            const transactions = this.transactionManager.getAllTransactions();
            const categories = [...new Set(transactions.map(t => t.category))].filter(Boolean);
            return categories.sort();
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des catégories:', error);
            return [];
        }
    }

    // Obtenir l'icône pour une catégorie
    getCategoryIcon(category) {
        const icons = {
            'Alimentation': '🍕',
            'Assurance maison': '🏠🛡️',
            'Assurance voiture': '🚗🛡️',
            'Cigarettes': '🚬',
            'EDF-GDF': '⚡',
            'Essence': '⛽',
            'Impôt': '🏛️',
            'Internet': '🌐',
            'Internet Outils': '🔧',
            'Logement': '🏠',
            'Loisirs': '🎬',
            'Loyer': '🏠',
            'Prêt': '💳',
            'Remboursement crédit': '🏦',
            'Retrait DAB': '🏧',
            'Salaire': '💼',
            'Santé': '🏥',
            'Transport': '🚗',
            'Vêtements': '👕',
            'Autres': '📦'
        };
        return icons[category] || '📂';
    }

    // Gestion évènements
    setupEventListeners() {
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', 
                Utils.debounce((e) => this.handleSearch(e.target.value), 300)
            );
            console.log('✅ Listener de recherche configuré');
        } else {
            console.warn('⚠️ Élément de recherche introuvable');
        }

        if (this.elements.categoryFilters) {
            this.elements.categoryFilters.addEventListener('change', (e) => {
                this.handleCategoryFilter(e);
            });
        }

        if (this.elements.typeFilters) {
            this.elements.typeFilters.addEventListener('change', (e) => {
                this.handleTypeFilter(e);
            });
        }

        [this.elements.dateRangeStart, this.elements.dateRangeEnd].forEach(el => {
            if (el) el.addEventListener('change', () => this.handleDateRangeFilter());
        });

        [this.elements.amountMin, this.elements.amountMax].forEach(el => {
            if (el) el.addEventListener('input', 
                Utils.debounce(() => this.handleAmountRangeFilter(), 500)
            );
        });

        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        if (this.elements.sortOrder) {
            this.elements.sortOrder.addEventListener('change', (e) => {
                this.currentFilters.sortOrder = e.target.value;
                this.applyFilters();
            });
        }

        if (this.elements.saveFilterBtn) {
            this.elements.saveFilterBtn.addEventListener('click', () => this.saveCurrentFilter());
        }

        if (this.elements.clearFiltersBtn) {
            this.elements.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        }

        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f' && !e.shiftKey) {
                e.preventDefault();
                this.focusSearch();
            }
            
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.toggleFilterPanel();
            }

            if (e.key === 'Escape') {
                this.closeFilterPanel();
            }
        });
    }

    // ===== GESTIONNAIRES DE FILTRES =====
    handleSearch(query) {
        this.currentFilters.search = query.trim();
        this.addToSearchHistory(query);
        this.applyFilters();
        this.highlightSearchTerms(query);
    }

    handleCategoryFilter(e) {
        const category = e.target.value;
        const isChecked = e.target.checked;

        if (isChecked) {
            this.currentFilters.categories.push(category);
        } else {
            this.currentFilters.categories = this.currentFilters.categories.filter(c => c !== category);
        }
        this.applyFilters();
    }

    handleTypeFilter(e) {
        const type = e.target.value;
        const isChecked = e.target.checked;

        if (isChecked) {
            this.currentFilters.types.push(type);
        } else {
            this.currentFilters.types = this.currentFilters.types.filter(t => t !== type);
        }
        this.applyFilters();
    }

    handleDateRangeFilter() {
        this.currentFilters.dateRange.start = this.elements.dateRangeStart?.value || null;
        this.currentFilters.dateRange.end = this.elements.dateRangeEnd?.value || null;
        this.applyFilters();
    }

    handleAmountRangeFilter() {
        this.currentFilters.amountRange.min = parseFloat(this.elements.amountMin?.value) || null;
        this.currentFilters.amountRange.max = parseFloat(this.elements.amountMax?.value) || null;
        this.applyFilters();
    }

    // ===== APPLICATION DES FILTRES =====
    applyFilters() {
        if (!this.transactionManager) {
            console.warn('⚠️ TransactionManager non disponible pour l\'application des filtres');
            return;
        }

        let filteredTransactions = this.transactionManager.getAllTransactions();

        if (this.currentFilters.search) {
            filteredTransactions = this.applyTextSearch(filteredTransactions, this.currentFilters.search);
        }

        if (this.currentFilters.categories.length > 0) {
            filteredTransactions = filteredTransactions.filter(t => 
                this.currentFilters.categories.includes(t.category)
            );
        }

        if (this.currentFilters.types.length > 0) {
            filteredTransactions = filteredTransactions.filter(t => 
                this.currentFilters.types.includes(t.type)
            );
        }

        if (this.currentFilters.dateRange.start || this.currentFilters.dateRange.end) {
            filteredTransactions = this.applyDateRangeFilter(filteredTransactions);
        }

        if (this.currentFilters.amountRange.min !== null || this.currentFilters.amountRange.max !== null) {
            filteredTransactions = this.applyAmountRangeFilter(filteredTransactions);
        }

        filteredTransactions = this.sortTransactions(filteredTransactions);
        this.lastFilteredResults = filteredTransactions;
        this.displayResults(filteredTransactions);
        this.updateFilterStatus();
    }

    applyTextSearch(transactions, query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return transactions.filter(transaction => {
            const searchableText = [
                transaction.label,
                transaction.category,
                transaction.amount.toString(),
                Utils.formatDateDisplay(transaction.date)
            ].join(' ').toLowerCase();

            return searchTerms.every(term => {
                if (term.startsWith('"') && term.endsWith('"')) {
                    return searchableText.includes(term.slice(1, -1));
                }
                
                if (term.startsWith('-')) {
                    return !searchableText.includes(term.slice(1));
                }
                
                if (term.startsWith('>') || term.startsWith('<') || term.startsWith('=')) {
                    return this.applyAmountComparison(transaction.amount, term);
                }
                
                return searchableText.includes(term);
            });
        });
    }

    applyDateRangeFilter(transactions) {
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            const startDate = this.currentFilters.dateRange.start ? new Date(this.currentFilters.dateRange.start) : null;
            const endDate = this.currentFilters.dateRange.end ? new Date(this.currentFilters.dateRange.end) : null;

            if (startDate && transactionDate < startDate) return false;
            if (endDate && transactionDate > endDate) return false;
            
            return true;
        });
    }

    applyAmountRangeFilter(transactions) {
        return transactions.filter(transaction => {
            const amount = Math.abs(transaction.amount);
            const min = this.currentFilters.amountRange.min;
            const max = this.currentFilters.amountRange.max;

            if (min !== null && amount < min) return false;
            if (max !== null && amount > max) return false;
            
            return true;
        });
    }

    applyAmountComparison(amount, term) {
        const operator = term.charAt(0);
        const value = parseFloat(term.slice(1));
        
        if (isNaN(value)) return false;
        
        const comparison = Math.abs(amount);
        
        switch (operator) {
            case '>': return comparison > value;
            case '<': return comparison < value;
            case '=': return Math.abs(comparison - value) < 0.01;
            default: return comparison === value;
        }
    }

    sortTransactions(transactions) {
        return [...transactions].sort((a, b) => {
            let comparison = 0;
            
            switch (this.currentFilters.sortBy) {
                case 'date':
                    comparison = new Date(a.date) - new Date(b.date);
                    break;
                case 'amount':
                    comparison = Math.abs(a.amount) - Math.abs(b.amount);
                    break;
                case 'category':
                    comparison = a.category.localeCompare(b.category);
                    break;
                case 'label':
                    comparison = a.label.localeCompare(b.label);
                    break;
                default:
                    comparison = new Date(a.date) - new Date(b.date);
            }
            
            return this.currentFilters.sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    // ===== AFFICHAGE DES RÉSULTATS AVEC TOTAL =====
    displayResults(transactions) {
        this.updateResultsCount(transactions.length);

        if (!this.elements.resultsContainer) {
            console.log('📋 Mise à jour de la liste principale avec', transactions.length, 'transactions');
            if (window.calendar && window.calendar.updateTransactionsList) {
                const originalTransactions = window.calendar.transactions;
                window.calendar.transactions = transactions;
                window.calendar.updateTransactionsList();
                window.calendar.transactions = originalTransactions;
            }
            return;
        }

        if (transactions.length === 0) {
            this.displayNoResults();
            return;
        }

        // Calculer les totaux
        const totals = this.calculateSearchTotals(transactions);

        // Créer le HTML des résultats avec le total
        const resultsHTML = transactions.map(transaction => this.createTransactionCard(transaction)).join('');
        
        this.elements.resultsContainer.innerHTML = `
            ${resultsHTML}
            <div class="search-totals-section">
                ${this.createTotalsDisplay(totals)}
            </div>
        `;

        this.addResultsEventListeners();
    }

    // ===== CALCUL DES TOTAUX =====
    calculateSearchTotals(transactions) {
        const totals = {
            totalIncome: 0,
            totalExpenses: 0,
            netBalance: 0,
            count: {
                income: 0,
                expenses: 0,
                total: transactions.length
            }
        };

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totals.totalIncome += transaction.amount;
                totals.count.income++;
            } else {
                totals.totalExpenses += transaction.amount;
                totals.count.expenses++;
            }
        });

        totals.netBalance = totals.totalIncome - totals.totalExpenses;
        return totals;
    }

    // ===== CRÉATION DE L'AFFICHAGE DES TOTAUX =====
    createTotalsDisplay(totals) {
        const netBalanceClass = totals.netBalance >= 0 ? 'positive' : 'negative';
        const netBalanceIcon = totals.netBalance >= 0 ? '📈' : '📉';

        return `
            <div class="search-totals-container">
                <h4 class="totals-title">📊 Résumé des résultats de recherche</h4>
                
                <div class="totals-grid">
                    <div class="total-card income">
                        <div class="total-icon">💰</div>
                        <div class="total-info">
                            <div class="total-label">Revenus</div>
                            <div class="total-amount">+${totals.totalIncome.toFixed(2)} €</div>
                            <div class="total-count">${totals.count.income} transaction${totals.count.income > 1 ? 's' : ''}</div>
                        </div>
                    </div>

                    <div class="total-card expense">
                        <div class="total-icon">💸</div>
                        <div class="total-info">
                            <div class="total-label">Dépenses</div>
                            <div class="total-amount">-${totals.totalExpenses.toFixed(2)} €</div>
                            <div class="total-count">${totals.count.expenses} transaction${totals.count.expenses > 1 ? 's' : ''}</div>
                        </div>
                    </div>

                    <div class="total-card balance ${netBalanceClass}">
                        <div class="total-icon">${netBalanceIcon}</div>
                        <div class="total-info">
                            <div class="total-label">Solde net</div>
                            <div class="total-amount">${totals.netBalance >= 0 ? '+' : ''}${totals.netBalance.toFixed(2)} €</div>
                            <div class="total-count">${totals.count.total} transaction${totals.count.total > 1 ? 's' : ''} au total</div>
                        </div>
                    </div>
                </div>

                <div class="totals-actions">
                    <button class="btn-secondary" onclick="window.advancedSearchManager?.exportFilteredResults('csv')" title="Exporter en CSV">
                        📊 Exporter CSV
                    </button>
                    <button class="btn-secondary" onclick="window.advancedSearchManager?.exportFilteredResults('json')" title="Exporter en JSON">
                        📄 Exporter JSON
                    </button>
                    <button class="btn-primary" onclick="window.advancedSearchManager?.showDetailedStats()" title="Statistiques détaillées des résultats filtrés">
                        📈 Stats des résultats
                    </button>
                </div>
            </div>
        `;
    }

    createTransactionCard(transaction) {
        const date = Utils.formatDateDisplay(transaction.date);
        const amount = Utils.formatCurrency(transaction.amount);
        const typeClass = transaction.type === 'income' ? 'income' : 'expense';
        const typeIcon = transaction.type === 'income' ? '💰' : '💸';

        return `
            <div class="transaction-result ${typeClass}" data-id="${transaction.id}">
                <div class="transaction-icon">${typeIcon}</div>
                <div class="transaction-info">
                    <div class="transaction-label">${transaction.label}</div>
                    <div class="transaction-category">${this.getCategoryIcon(transaction.category)} ${transaction.category}</div>
                    <div class="transaction-date">${date}</div>
                </div>
                <div class="transaction-amount ${typeClass}">${amount}</div>
                <div class="transaction-actions">
                    <button class="btn-edit" data-id="${transaction.id}" title="Modifier">✏️</button>
                    <button class="btn-delete" data-id="${transaction.id}" title="Supprimer">🗑️</button>
                </div>
            </div>
        `;
    }

    displayNoResults() {
        if (this.elements.resultsContainer) {
            this.elements.resultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <div class="no-results-message">Aucune transaction trouvée</div>
                    <div class="no-results-suggestion">
                        Essayez de modifier vos critères de recherche
                    </div>
                </div>
            `;
        }
    }

    updateResultsCount(count) {
        if (this.elements.resultsCount) {
            const totalTransactions = this.transactionManager?.getAllTransactions().length || 0;
            this.elements.resultsCount.textContent = 
                `${count} résultat${count > 1 ? 's' : ''} sur ${totalTransactions} transaction${totalTransactions > 1 ? 's' : ''}`;
        }
    }

    // ===== STATISTIQUES DÉTAILLÉES =====
    showDetailedStats() {
        const transactions = this.lastFilteredResults;
        if (!transactions || transactions.length === 0) {
            alert('Aucune donnée à analyser');
            return;
        }

        const stats = this.calculateDetailedStats(transactions);
        this.displayDetailedStatsModal(stats);
    }

    calculateDetailedStats(transactions) {
        const stats = {
            basic: this.calculateSearchTotals(transactions),
            byCategory: {},
            byMonth: {},
            averages: {
                perTransaction: 0,
                perDay: 0,
                income: 0,
                expense: 0
            }
        };

        transactions.forEach(transaction => {
            const category = transaction.category;
            if (!stats.byCategory[category]) {
                stats.byCategory[category] = {
                    total: 0,
                    count: 0,
                    income: 0,
                    expenses: 0
                };
            }

            stats.byCategory[category].total += transaction.amount;
            stats.byCategory[category].count++;

            if (transaction.type === 'income') {
                stats.byCategory[category].income += transaction.amount;
            } else {
                stats.byCategory[category].expenses += transaction.amount;
            }
        });

        transactions.forEach(transaction => {
            const month = transaction.date.substring(0, 7);
            if (!stats.byMonth[month]) {
                stats.byMonth[month] = {
                    income: 0,
                    expenses: 0,
                    net: 0,
                    count: 0
                };
            }

            stats.byMonth[month].count++;
            if (transaction.type === 'income') {
                stats.byMonth[month].income += transaction.amount;
            } else {
                stats.byMonth[month].expenses += transaction.amount;
            }
            stats.byMonth[month].net = stats.byMonth[month].income - stats.byMonth[month].expenses;
        });

        if (transactions.length > 0) {
            const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
            stats.averages.perTransaction = totalAmount / transactions.length;

            const incomeTransactions = transactions.filter(t => t.type === 'income');
            const expenseTransactions = transactions.filter(t => t.type === 'expense');

            if (incomeTransactions.length > 0) {
                stats.averages.income = incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length;
            }

            if (expenseTransactions.length > 0) {
                stats.averages.expense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length;
            }

            const dates = [...new Set(transactions.map(t => t.date))];
            if (dates.length > 0) {
                stats.averages.perDay = totalAmount / dates.length;
            }
        }

        return stats;
    }

    displayDetailedStatsModal(stats) {
        const filterCount = this.lastFilteredResults.length;
        const totalCount = this.transactionManager?.getAllTransactions().length || 0;
        
        const modal = document.createElement('div');
        modal.className = 'stats-modal-overlay';
        modal.innerHTML = `
            <div class="stats-modal">
                <div class="stats-modal-header">
                    <h3>📊 Statistiques des résultats filtrés</h3>
                    <div class="stats-subtitle">${filterCount} transaction${filterCount > 1 ? 's' : ''} sur ${totalCount} au total</div>
                    <button class="modal-close" onclick="this.closest('.stats-modal-overlay').remove()">×</button>
                </div>
                <div class="stats-modal-content">
                    ${this.createDetailedStatsHTML(stats)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createDetailedStatsHTML(stats) {
        const topCategories = Object.entries(stats.byCategory)
            .sort(([,a], [,b]) => b.total - a.total)
            .slice(0, 5);

        const monthlyEvolution = Object.entries(stats.byMonth)
            .sort(([a], [b]) => a.localeCompare(b));

        return `
            <div class="detailed-stats-grid">
                <div class="stats-section">
                    <h4>💰 Moyennes</h4>
                    <div class="stats-list">
                        <div class="stat-item">
                            <span>Par transaction:</span>
                            <span class="stat-value">${stats.averages.perTransaction.toFixed(2)} €</span>
                        </div>
                        <div class="stat-item">
                            <span>Par jour:</span>
                            <span class="stat-value">${stats.averages.perDay.toFixed(2)} €</span>
                        </div>
                        <div class="stat-item">
                            <span>Revenus moyens:</span>
                            <span class="stat-value income">${stats.averages.income.toFixed(2)} €</span>
                        </div>
                        <div class="stat-item">
                            <span>Dépenses moyennes:</span>
                            <span class="stat-value expense">${stats.averages.expense.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <h4>📂 Top 5 Catégories</h4>
                    <div class="stats-list">
                        ${topCategories.map(([category, data]) => `
                            <div class="stat-item">
                                <span>${category}:</span>
                                <span class="stat-value">${data.total.toFixed(2)} € (${data.count} tx)</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stats-section full-width">
                    <h4>📅 Évolution mensuelle</h4>
                    <div class="monthly-stats">
                        ${monthlyEvolution.map(([month, data]) => `
                            <div class="monthly-stat">
                                <div class="month-label">${this.formatMonthDisplay(month)}</div>
                                <div class="month-values">
                                    <div class="income">+${data.income.toFixed(2)} €</div>
                                    <div class="expense">-${data.expenses.toFixed(2)} €</div>
                                    <div class="net ${data.net >= 0 ? 'positive' : 'negative'}">${data.net >= 0 ? '+' : ''}${data.net.toFixed(2)} €</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    formatMonthDisplay(monthString) {
        const [year, month] = monthString.split('-');
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    // ===== FILTRES RAPIDES =====
    createQuickFilters() {
        const quickFilters = [
            { name: 'Cette semaine', action: () => this.filterThisWeek() },
            { name: 'Ce mois', action: () => this.filterThisMonth() },
            { name: 'Gros montants', action: () => this.filterLargeAmounts() },
            { name: 'Dépenses uniquement', action: () => this.filterExpensesOnly() },
            { name: 'Revenus uniquement', action: () => this.filterIncomeOnly() }
        ];

        if (this.elements.quickFilters) {
            this.elements.quickFilters.innerHTML = quickFilters.map(filter => 
                `<button class="quick-filter-btn" data-filter="${filter.name}">${filter.name}</button>`
            ).join('');

            this.elements.quickFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('quick-filter-btn')) {
                    const filterName = e.target.dataset.filter;
                    const filter = quickFilters.find(f => f.name === filterName);
                    if (filter) filter.action();
                }
            });

            console.log('✅ Filtres rapides créés');
        } else {
            console.warn('⚠️ Élément quick-filters introuvable');
        }
    }

    filterThisWeek() {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        
        this.currentFilters.dateRange.start = Utils.formatDateString(startOfWeek);
        this.currentFilters.dateRange.end = Utils.formatDateString(endOfWeek);
        this.updateDateInputs();
        this.applyFilters();
    }

    filterThisMonth() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        this.currentFilters.dateRange.start = Utils.formatDateString(startOfMonth);
        this.currentFilters.dateRange.end = Utils.formatDateString(endOfMonth);
        this.updateDateInputs();
        this.applyFilters();
    }

    filterLargeAmounts() {
        this.currentFilters.amountRange.min = 100;
        this.updateAmountInputs();
        this.applyFilters();
    }

    filterExpensesOnly() {
        this.currentFilters.types = ['expense'];
        this.updateTypeCheckboxes();
        this.applyFilters();
    }

    filterIncomeOnly() {
        this.currentFilters.types = ['income'];
        this.updateTypeCheckboxes();
        this.applyFilters();
    }

    // ===== GESTION DES HISTORIQUES ET SAUVEGARDES =====
    addToSearchHistory(query) {
        if (query && query.length > 2 && !this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10);
        }
    }

    clearAllFilters() {
        this.currentFilters = {
            search: '',
            categories: [],
            types: [],
            dateRange: { start: null, end: null },
            amountRange: { min: null, max: null },
            tags: [],
            sortBy: 'date',
            sortOrder: 'desc'
        };

        if (this.elements.searchInput) this.elements.searchInput.value = '';
        this.updateDateInputs();
        this.updateAmountInputs();
        this.updateCategoryCheckboxes();
        this.updateTypeCheckboxes();

        this.applyFilters();
    }

    // ===== MISE À JOUR DES INPUTS =====
    updateDateInputs() {
        if (this.elements.dateRangeStart) this.elements.dateRangeStart.value = this.currentFilters.dateRange.start || '';
        if (this.elements.dateRangeEnd) this.elements.dateRangeEnd.value = this.currentFilters.dateRange.end || '';
    }

    updateAmountInputs() {
        if (this.elements.amountMin) this.elements.amountMin.value = this.currentFilters.amountRange.min || '';
        if (this.elements.amountMax) this.elements.amountMax.value = this.currentFilters.amountRange.max || '';
    }

    updateCategoryCheckboxes() {
        const checkboxes = this.elements.categoryFilters?.querySelectorAll('input[type="checkbox"]');
        checkboxes?.forEach(cb => {
            cb.checked = this.currentFilters.categories.includes(cb.value);
        });
    }

    updateTypeCheckboxes() {
        const checkboxes = this.elements.typeFilters?.querySelectorAll('input[type="checkbox"]');
        checkboxes?.forEach(cb => {
            cb.checked = this.currentFilters.types.includes(cb.value);
        });
    }

    // ===== STATUT DES FILTRES =====
    updateFilterStatus() {
        const activeFilters = this.getActiveFiltersCount();
        const statusElement = document.getElementById('filter-status');
        
        if (statusElement) {
            if (activeFilters > 0) {
                const activeDetails = this.getActiveFiltersDetails();
                statusElement.innerHTML = `
                    <span class="filter-count" onclick="toggleDetailedFilters()">${activeFilters} filtre(s) actif(s) ▼</span>
                    <div class="detailed-filters" id="detailed-filters" style="display: none;">
                        ${this.generateDetailedFiltersHTML(activeDetails)}
                    </div>
                `;
                statusElement.className = 'filter-status filters-active';
            } else {
                statusElement.textContent = '';
                statusElement.className = 'filter-status filters-inactive';
            }
        }
    }

    getActiveFiltersCount() {
        let count = 0;
        
        if (this.currentFilters.search) count++;
        if (this.currentFilters.categories.length > 0) count++;
        if (this.currentFilters.types.length > 0) count++;
        if (this.currentFilters.dateRange.start || this.currentFilters.dateRange.end) count++;
        if (this.currentFilters.amountRange.min !== null || this.currentFilters.amountRange.max !== null) count++;
        
        return count;
    }

    getActiveFiltersDetails() {
        const activeFilters = [];

        if (this.currentFilters.search) {
            activeFilters.push({
                type: 'search',
                label: 'Recherche',
                value: `"${this.currentFilters.search}"`,
                icon: '🔍'
            });
        }

        if (this.currentFilters.categories.length > 0) {
            activeFilters.push({
                type: 'categories',
                label: 'Catégories',
                value: this.currentFilters.categories.join(', '),
                icon: '📂'
            });
        }

        if (this.currentFilters.types.length > 0) {
            const typeLabels = this.currentFilters.types.map(type => 
                type === 'income' ? 'Revenus' : 'Dépenses'
            );
            activeFilters.push({
                type: 'types',
                label: 'Types',
                value: typeLabels.join(', '),
                icon: '💰'
            });
        }

        if (this.currentFilters.dateRange.start || this.currentFilters.dateRange.end) {
            const start = this.currentFilters.dateRange.start ? this.formatDateForDisplay(this.currentFilters.dateRange.start) : '';
            const end = this.currentFilters.dateRange.end ? this.formatDateForDisplay(this.currentFilters.dateRange.end) : '';
            const dateRange = start && end ? `${start} - ${end}` : start || end;
            
            activeFilters.push({
                type: 'dateRange',
                label: 'Période',
                value: dateRange,
                icon: '📅'
            });
        }

        if (this.currentFilters.amountRange.min !== null || this.currentFilters.amountRange.max !== null) {
            const min = this.currentFilters.amountRange.min !== null ? `${this.currentFilters.amountRange.min}€` : '';
            const max = this.currentFilters.amountRange.max !== null ? `${this.currentFilters.amountRange.max}€` : '';
            const amountRange = min && max ? `${min} - ${max}` : min || max;
            
            activeFilters.push({
                type: 'amountRange',
                label: 'Montant',
                value: amountRange,
                icon: '💶'
            });
        }

        return activeFilters;
    }

    generateDetailedFiltersHTML(activeFilters) {
        return activeFilters.map(filter => `
            <div class="filter-detail-item">
                <span class="filter-icon">${filter.icon}</span>
                <span class="filter-label">${filter.label}:</span>
                <span class="filter-value">${filter.value}</span>
                <button class="filter-remove-btn" onclick="removeSpecificFilter('${filter.type}')" title="Supprimer ce filtre">×</button>
            </div>
        `).join('');
    }

    removeSpecificFilter(filterType) {
        switch (filterType) {
            case 'search':
                this.currentFilters.search = '';
                if (this.elements.searchInput) {
                    this.elements.searchInput.value = '';
                }
                break;
            case 'categories':
                this.currentFilters.categories = [];
                this.updateCategoryCheckboxes();
                break;
            case 'types':
                this.currentFilters.types = [];
                this.updateTypeCheckboxes();
                break;
            case 'dateRange':
                this.currentFilters.dateRange = { start: null, end: null };
                this.updateDateInputs();
                break;
            case 'amountRange':
                this.currentFilters.amountRange = { min: null, max: null };
                this.updateAmountInputs();
                break;
        }
        
        this.applyFilters();
    }

    formatDateForDisplay(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // ===== INTERFACE =====
    focusSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.focus();
            this.elements.searchInput.select();
        }
    }

    toggleFilterPanel() {
        if (this.elements.filterPanel) {
            this.elements.filterPanel.classList.toggle('visible');
            console.log('🔄 Panneau de filtres basculé:', this.elements.filterPanel.classList.contains('visible'));
        } else {
            console.warn('⚠️ Panneau de filtres introuvable');
        }
    }

    closeFilterPanel() {
        if (this.elements.filterPanel) {
            this.elements.filterPanel.classList.remove('visible');
        }
    }

    // ===== GESTION DES ÉVÉNEMENTS SUR LES RÉSULTATS =====
    addResultsEventListeners() {
        if (this.elements.resultsContainer) {
            this.elements.resultsContainer.addEventListener('click', (e) => {
                const transactionId = e.target.dataset.id;
                
                if (e.target.classList.contains('btn-edit')) {
                    this.editTransaction(parseInt(transactionId));
                } else if (e.target.classList.contains('btn-delete')) {
                    this.deleteTransaction(parseInt(transactionId));
                }
            });
        }
    }

    editTransaction(id) {
        const transaction = this.transactionManager.getTransaction(id);
        if (transaction && window.calendar) {
            window.calendar.elements.date.valueAsDate = new Date(transaction.date);
            window.calendar.elements.label.value = transaction.label;
            window.calendar.elements.amount.value = Math.abs(transaction.amount);
            window.calendar.elements.category.value = transaction.category;
            
            if (transaction.type === 'income') {
                window.calendar.elements.typeIncome.checked = true;
            } else {
                window.calendar.elements.typeExpense.checked = true;
            }
            
            window.calendar.editingTransactionId = id;
            console.log('✏️ Transaction chargée pour édition:', transaction);
        }
    }

    deleteTransaction(id) {
        if (confirm('Supprimer cette transaction ?')) {
            this.transactionManager.deleteTransaction(id);
            this.applyFilters();
            
            if (window.calendar) {
                window.calendar.updateCalendar();
                window.calendar.updateTransactionsList();
            }
        }
    }

    // ===== GESTION DES FILTRES SAUVEGARDÉS =====
    saveCurrentFilter() {
        const filterName = prompt('Nom du filtre sauvegardé:');
        if (filterName) {
            this.savedFilters.push({
                name: filterName,
                filters: { ...this.currentFilters },
                createdAt: new Date().toISOString()
            });
            this.savePersistentFilters();
            this.updateFilterPresets();
        }
    }

    loadSavedFilters() {
        try {
            const saved = localStorage.getItem('budget-saved-filters');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Erreur lors du chargement des filtres sauvegardés:', error);
            return [];
        }
    }

    savePersistentFilters() {
        try {
            localStorage.setItem('budget-saved-filters', JSON.stringify(this.savedFilters));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des filtres:', error);
        }
    }

    updateFilterPresets() {
        if (!this.elements.filterPresets) return;

        this.elements.filterPresets.innerHTML = this.savedFilters.map(filter => `
            <div class="filter-preset">
                <button class="preset-load" onclick="window.advancedSearchManager.loadPreset('${filter.name}')">${filter.name}</button>
                <button class="preset-delete" onclick="window.advancedSearchManager.deletePreset('${filter.name}')">×</button>
            </div>
        `).join('');
    }

    loadPreset(name) {
        const preset = this.savedFilters.find(f => f.name === name);
        if (preset) {
            this.currentFilters = { ...preset.filters };
            
            if (this.elements.searchInput) this.elements.searchInput.value = this.currentFilters.search || '';
            this.updateDateInputs();
            this.updateAmountInputs();
            this.updateCategoryCheckboxes();
            this.updateTypeCheckboxes();
            
            this.applyFilters();
        }
    }

    deletePreset(name) {
        if (confirm(`Supprimer le filtre "${name}" ?`)) {
            this.savedFilters = this.savedFilters.filter(f => f.name !== name);
            this.savePersistentFilters();
            this.updateFilterPresets();
        }
    }

    // ===== MISE EN ÉVIDENCE DES TERMES DE RECHERCHE =====
    highlightSearchTerms(query) {
        if (!query || !this.elements.resultsContainer) return;

        const terms = query.toLowerCase().split(' ').filter(term => term.length > 2);
        const elements = this.elements.resultsContainer.querySelectorAll('.transaction-label, .transaction-category');

        elements.forEach(element => {
            let text = element.textContent;
            terms.forEach(term => {
                const regex = new RegExp(`(${term})`, 'gi');
                text = text.replace(regex, '<mark>$1</mark>');
            });
            element.innerHTML = text;
        });
    }

    // ===== EXPORT DES RÉSULTATS =====
    exportFilteredResults(format = 'csv') {
        const filteredTransactions = this.getFilteredTransactions();
        
        if (format === 'csv') {
            return this.exportToCSV(filteredTransactions);
        } else if (format === 'json') {
            return this.exportToJSON(filteredTransactions);
        }
    }

    exportToCSV(transactions) {
        const headers = ['Date', 'Libellé', 'Catégorie', 'Montant', 'Type'];
        const rows = transactions.map(t => [
            Utils.formatDateDisplay(t.date),
            t.label,
            t.category,
            t.amount,
            t.type === 'income' ? 'Revenu' : 'Dépense'
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions_filtered_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    }

    exportToJSON(transactions) {
        const jsonContent = JSON.stringify(transactions, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions_filtered_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    }

    getFilteredTransactions() {
        return this.lastFilteredResults || [];
    }

    // ===== ANALYTICS SUR LES RECHERCHES =====
    getSearchAnalytics() {
        return {
            searchHistory: this.searchHistory,
            savedFilters: this.savedFilters,
            mostUsedCategories: this.getMostSearchedCategories(),
            averageResultsCount: this.getAverageResultsCount()
        };
    }

    getMostSearchedCategories() {
        const categoryUsage = {};
        this.savedFilters.forEach(filter => {
            filter.filters.categories.forEach(cat => {
                categoryUsage[cat] = (categoryUsage[cat] || 0) + 1;
            });
        });
        
        return Object.entries(categoryUsage)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
    }

    getAverageResultsCount() {
        return this.lastFilteredResults ? this.lastFilteredResults.length : 0;
    }
}

// Fonction globale pour basculer l'affichage détaillé
function toggleDetailedFilters() {
    const detailedElement = document.getElementById('detailed-filters');
    const toggleIcon = document.querySelector('.filter-count');
    
    if (detailedElement) {
        const isVisible = detailedElement.style.display !== 'none';
        detailedElement.style.display = isVisible ? 'none' : 'block';
        
        if (toggleIcon) {
            toggleIcon.innerHTML = toggleIcon.innerHTML.replace(
                isVisible ? '▲' : '▼',
                isVisible ? '▼' : '▲'
            );
        }
    }
}

// Fonction globale pour supprimer un filtre spécifique
function removeSpecificFilter(filterType) {
    if (window.advancedSearchManager) {
        window.advancedSearchManager.removeSpecificFilter(filterType);
    }
}