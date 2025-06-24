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
        this.initializeElements();
        this.setupEventListeners();
    }

    // ===== INITIALISATION =====
    initializeElements() {
        this.elements = {
            searchInput: document.getElementById('advanced-search-input'),
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
    }

    setupEventListeners() {
        // Recherche en temps réel avec debounce
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', 
                Utils.debounce((e) => this.handleSearch(e.target.value), 300)
            );
        }

        // Filtres de catégorie
        if (this.elements.categoryFilters) {
            this.elements.categoryFilters.addEventListener('change', (e) => {
                this.handleCategoryFilter(e);
            });
        }

        // Filtres de type
        if (this.elements.typeFilters) {
            this.elements.typeFilters.addEventListener('change', (e) => {
                this.handleTypeFilter(e);
            });
        }

        // Plages de dates
        [this.elements.dateRangeStart, this.elements.dateRangeEnd].forEach(el => {
            if (el) el.addEventListener('change', () => this.handleDateRangeFilter());
        });

        // Plages de montants
        [this.elements.amountMin, this.elements.amountMax].forEach(el => {
            if (el) el.addEventListener('input', 
                Utils.debounce(() => this.handleAmountRangeFilter(), 500)
            );
        });

        // Tri
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

        // Actions de filtre
        if (this.elements.saveFilterBtn) {
            this.elements.saveFilterBtn.addEventListener('click', () => this.saveCurrentFilter());
        }

        if (this.elements.clearFiltersBtn) {
            this.elements.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        }

        // Raccourcis clavier
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+F : Focus sur recherche
            if (e.ctrlKey && e.key === 'f' && !e.shiftKey) {
                e.preventDefault();
                this.focusSearch();
            }
            
            // Ctrl+Shift+F : Ouvrir panneau de filtres
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.toggleFilterPanel();
            }

            // Escape : Fermer filtres
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
        let filteredTransactions = this.transactionManager.getAllTransactions();

        // Filtre de recherche textuelle
        if (this.currentFilters.search) {
            filteredTransactions = this.applyTextSearch(filteredTransactions, this.currentFilters.search);
        }

        // Filtre par catégories
        if (this.currentFilters.categories.length > 0) {
            filteredTransactions = filteredTransactions.filter(t => 
                this.currentFilters.categories.includes(t.category)
            );
        }

        // Filtre par types
        if (this.currentFilters.types.length > 0) {
            filteredTransactions = filteredTransactions.filter(t => 
                this.currentFilters.types.includes(t.type)
            );
        }

        // Filtre par plage de dates
        if (this.currentFilters.dateRange.start || this.currentFilters.dateRange.end) {
            filteredTransactions = this.applyDateRangeFilter(filteredTransactions);
        }

        // Filtre par plage de montants
        if (this.currentFilters.amountRange.min !== null || this.currentFilters.amountRange.max !== null) {
            filteredTransactions = this.applyAmountRangeFilter(filteredTransactions);
        }

        // Tri
        filteredTransactions = this.sortTransactions(filteredTransactions);

        // Affichage des résultats
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
                // Recherche exacte avec guillemets
                if (term.startsWith('"') && term.endsWith('"')) {
                    return searchableText.includes(term.slice(1, -1));
                }
                
                // Recherche par exclusion avec -
                if (term.startsWith('-')) {
                    return !searchableText.includes(term.slice(1));
                }
                
                // Recherche de montant avec comparateurs
                if (term.startsWith('>') || term.startsWith('<') || term.startsWith('=')) {
                    return this.applyAmountComparison(transaction.amount, term);
                }
                
                // Recherche normale
                return searchableText.includes(term);
            });
        });
    }

    applyAmountComparison(amount, term) {
        const operator = term.charAt(0);
        const value = parseFloat(term.slice(1));
        
        if (isNaN(value)) return true;
        
        switch (operator) {
            case '>': return amount > value;
            case '<': return amount < value;
            case '=': return Math.abs(amount - value) < 0.01;
            default: return true;
        }
    }

    applyDateRangeFilter(transactions) {
        const start = this.currentFilters.dateRange.start;
        const end = this.currentFilters.dateRange.end;

        return transactions.filter(t => {
            if (start && t.date < start) return false;
            if (end && t.date > end) return false;
            return true;
        });
    }

    applyAmountRangeFilter(transactions) {
        const min = this.currentFilters.amountRange.min;
        const max = this.currentFilters.amountRange.max;

        return transactions.filter(t => {
            if (min !== null && t.amount < min) return false;
            if (max !== null && t.amount > max) return false;
            return true;
        });
    }

    sortTransactions(transactions) {
        const sortBy = this.currentFilters.sortBy;
        const order = this.currentFilters.sortOrder;

        return transactions.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'date':
                    comparison = new Date(a.date) - new Date(b.date);
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'label':
                    comparison = a.label.localeCompare(b.label);
                    break;
                case 'category':
                    comparison = a.category.localeCompare(b.category);
                    break;
                case 'type':
                    comparison = a.type.localeCompare(b.type);
                    break;
                default:
                    comparison = 0;
            }

            return order === 'desc' ? -comparison : comparison;
        });
    }

    // ===== AFFICHAGE DES RÉSULTATS =====
    displayResults(transactions) {
        if (!this.elements.resultsContainer) return;

        this.updateResultsCount(transactions.length);

        if (transactions.length === 0) {
            this.displayNoResults();
            return;
        }

        const resultsHTML = transactions.map(transaction => this.createTransactionCard(transaction)).join('');
        this.elements.resultsContainer.innerHTML = resultsHTML;

        // Ajouter les event listeners pour les actions
        this.addResultsEventListeners();
    }

    createTransactionCard(transaction) {
        const date = Utils.formatDateDisplay(transaction.date);
        const amount = Utils.formatCurrency(transaction.amount);
        const typeClass = transaction.type === 'income' ? 'income' : 'expense';
        const typeIcon = transaction.type === 'income' ? '💰' : '💸';

        return `
            <div class="search-result-card ${typeClass}" data-transaction-id="${transaction.id}">
                <div class="result-header">
                    <div class="result-date">${date}</div>
                    <div class="result-type">${typeIcon}</div>
                </div>
                <div class="result-content">
                    <div class="result-label">${this.highlightText(transaction.label)}</div>
                    <div class="result-category">${transaction.category}</div>
                </div>
                <div class="result-amount ${typeClass}">${amount}</div>
                <div class="result-actions">
                    <button class="btn-edit" data-id="${transaction.id}">✏️</button>
                    <button class="btn-delete" data-id="${transaction.id}">🗑️</button>
                </div>
            </div>
        `;
    }

    highlightText(text) {
        if (!this.currentFilters.search) return text;
        
        const query = this.currentFilters.search;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    displayNoResults() {
        this.elements.resultsContainer.innerHTML = `
            <div class="no-search-results">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-title">Aucun résultat trouvé</div>
                <div class="no-results-subtitle">
                    Essayez de modifier vos critères de recherche
                </div>
                <div class="search-tips">
                    <h4>💡 Astuces de recherche :</h4>
                    <ul>
                        <li><code>"texte exact"</code> - Recherche exacte</li>
                        <li><code>-mot</code> - Exclure un mot</li>
                        <li><code>>50</code> - Montant supérieur à 50€</li>
                        <li><code><100</code> - Montant inférieur à 100€</li>
                    </ul>
                </div>
            </div>
        `;
    }

    updateResultsCount(count) {
        if (this.elements.resultsCount) {
            const totalTransactions = this.transactionManager.getAllTransactions().length;
            this.elements.resultsCount.textContent = 
                `${count} résultat${count > 1 ? 's' : ''} sur ${totalTransactions} transaction${totalTransactions > 1 ? 's' : ''}`;
        }
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
        const transactions = this.transactionManager.getAllTransactions();
        const amounts = transactions.map(t => t.amount).sort((a, b) => b - a);
        const threshold = amounts[Math.floor(amounts.length * 0.1)]; // Top 10%
        
        this.currentFilters.amountRange.min = threshold;
        if (this.elements.amountMin) this.elements.amountMin.value = threshold;
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

    // ===== GESTION DES FILTRES SAUVEGARDÉS =====
    saveCurrentFilter() {
        const filterName = prompt('Nom du filtre :');
        if (!filterName) return;

        const filter = {
            name: filterName,
            filters: { ...this.currentFilters },
            createdAt: new Date().toISOString()
        };

        this.savedFilters.push(filter);
        this.savePersistentFilters();
        this.updateFilterPresets();
        Utils.showNotification(`Filtre "${filterName}" sauvegardé`, 'success');
    }

    loadSavedFilter(filterName) {
        const savedFilter = this.savedFilters.find(f => f.name === filterName);
        if (!savedFilter) return;

        this.currentFilters = { ...savedFilter.filters };
        this.updateAllFilterInputs();
        this.applyFilters();
    }

    deleteSavedFilter(filterName) {
        this.savedFilters = this.savedFilters.filter(f => f.name !== filterName);
        this.savePersistentFilters();
        this.updateFilterPresets();
    }

    updateFilterPresets() {
        if (!this.elements.filterPresets) return;

        this.elements.filterPresets.innerHTML = this.savedFilters.map(filter => `
            <div class="filter-preset">
                <button class="preset-load" data-filter="${filter.name}">
                    ${filter.name}
                </button>
                <button class="preset-delete" data-filter="${filter.name}">×</button>
            </div>
        `).join('');

        // Event listeners pour les presets
        this.elements.filterPresets.addEventListener('click', (e) => {
            const filterName = e.target.dataset.filter;
            if (e.target.classList.contains('preset-load')) {
                this.loadSavedFilter(filterName);
            } else if (e.target.classList.contains('preset-delete')) {
                if (confirm(`Supprimer le filtre "${filterName}" ?`)) {
                    this.deleteSavedFilter(filterName);
                }
            }
        });
    }

    // ===== UTILS ET HELPERS =====
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

        this.updateAllFilterInputs();
        this.applyFilters();
    }

    updateAllFilterInputs() {
        if (this.elements.searchInput) this.elements.searchInput.value = this.currentFilters.search;
        this.updateDateInputs();
        this.updateAmountInputs();
        this.updateCategoryCheckboxes();
        this.updateTypeCheckboxes();
        if (this.elements.sortSelect) this.elements.sortSelect.value = this.currentFilters.sortBy;
        if (this.elements.sortOrder) this.elements.sortOrder.value = this.currentFilters.sortOrder;
    }

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

    updateFilterStatus() {
        const activeFilters = this.getActiveFiltersCount();
        const statusElement = document.getElementById('filter-status');
        
        if (statusElement) {
            statusElement.textContent = activeFilters > 0 ? `${activeFilters} filtre(s) actif(s)` : '';
            statusElement.className = activeFilters > 0 ? 'filters-active' : 'filters-inactive';
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

    addToSearchHistory(query) {
        if (!query || this.searchHistory.includes(query)) return;
        
        this.searchHistory.unshift(query);
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }
        
        localStorage.setItem('budget-search-history', JSON.stringify(this.searchHistory));
    }

    // ===== PERSISTANCE =====
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
        }
    }

    closeFilterPanel() {
        if (this.elements.filterPanel) {
            this.elements.filterPanel.classList.remove('visible');
        }
    }

    addResultsEventListeners() {
        // Actions sur les résultats de recherche
        this.elements.resultsContainer.addEventListener('click', (e) => {
            const transactionId = e.target.dataset.id;
            
            if (e.target.classList.contains('btn-edit')) {
                this.editTransaction(parseInt(transactionId));
            } else if (e.target.classList.contains('btn-delete')) {
                this.deleteTransaction(parseInt(transactionId));
            }
        });
    }

    editTransaction(id) {
        // Intégration avec le système existant d'édition
        const transaction = this.transactionManager.getTransaction(id);
        if (transaction) {
            // Ouvrir le modal d'édition ou remplir le formulaire
            console.log('Édition transaction:', transaction);
        }
    }

    deleteTransaction(id) {
        if (confirm('Supprimer cette transaction ?')) {
            this.transactionManager.deleteTransaction(id);
            this.applyFilters(); // Rafraîchir les résultats
        }
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

    getFilteredTransactions() {
        // Retourne les transactions actuellement filtrées
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
        // Analyser les catégories les plus recherchées
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
}