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
        this.generateCategoryOptions(); // Ajout de cette méthode manquante
    }

    // ===== INITIALISATION =====
    initializeElements() {
        this.elements = {
            // Correction: utiliser l'ID correct du champ de recherche
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

        // Debug: afficher les éléments trouvés
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
            // Récupérer toutes les catégories utilisées
            const categories = this.getAllCategories();
            
            if (categories.length === 0) {
                console.warn('⚠️ Aucune catégorie trouvée');
                return;
            }

            // Générer les checkboxes pour les catégories
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

    setupEventListeners() {
        // Recherche en temps réel avec debounce
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', 
                Utils.debounce((e) => this.handleSearch(e.target.value), 300)
            );
            console.log('✅ Listener de recherche configuré');
        } else {
            console.warn('⚠️ Élément de recherche introuvable');
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
        if (!this.transactionManager) {
            console.warn('⚠️ TransactionManager non disponible pour l\'application des filtres');
            return;
        }

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

        // Stocker les résultats
        this.lastFilteredResults = filteredTransactions;

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

    // ===== AFFICHAGE DES RÉSULTATS =====
    displayResults(transactions) {
        this.updateResultsCount(transactions.length);

        // Si aucun conteneur de résultats, afficher dans la liste principale
        if (!this.elements.resultsContainer) {
            console.log('📋 Mise à jour de la liste principale avec', transactions.length, 'transactions');
            // Mettre à jour la liste principale des transactions
            if (window.calendar && window.calendar.updateTransactionsList) {
                // Temporairement remplacer les transactions filtrées
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
            this.searchHistory = this.searchHistory.slice(0, 10); // Limiter à 10 entrées
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

        // Réinitialiser les inputs
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

    // Supprimer un filtre spécifique
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

    // Méthode utilitaire pour formater les dates d'affichage
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
        // Actions sur les résultats de recherche
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
        // Intégration avec le système existant d'édition
        const transaction = this.transactionManager.getTransaction(id);
        if (transaction && window.calendar) {
            // Remplir le formulaire avec les données de la transaction
            window.calendar.elements.date.valueAsDate = new Date(transaction.date);
            window.calendar.elements.label.value = transaction.label;
            window.calendar.elements.amount.value = Math.abs(transaction.amount);
            window.calendar.elements.category.value = transaction.category;
            
            if (transaction.type === 'income') {
                window.calendar.elements.typeIncome.checked = true;
            } else {
                window.calendar.elements.typeExpense.checked = true;
            }
            
            // Stocker l'ID pour l'édition
            window.calendar.editingTransactionId = id;
            
            console.log('✏️ Transaction chargée pour édition:', transaction);
        }
    }

    deleteTransaction(id) {
        if (confirm('Supprimer cette transaction ?')) {
            this.transactionManager.deleteTransaction(id);
            this.applyFilters(); // Rafraîchir les résultats
            
            // Mettre à jour l'affichage principal
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
            
            // Mettre à jour les inputs
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

    getAverageResultsCount() {
        // Calculer le nombre moyen de résultats
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

// Fonction globale pour supprimer un filtre spécifique (accessible depuis le HTML)
function removeSpecificFilter(filterType) {
    // Cette fonction sera appelée par l'instance active du AdvancedSearchManager
    if (window.advancedSearchManager) {
        window.advancedSearchManager.removeSpecificFilter(filterType);
    }
}